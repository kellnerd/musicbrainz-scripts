// ==UserScript==
// @name          MusicBrainz: Import ARD radio dramas
// @version       2022.10.22
// @namespace     https://github.com/kellnerd/musicbrainz-scripts
// @author        kellnerd
// @description   Imports German broadcast releases from the ARD radio drama database.
// @homepageURL   https://github.com/kellnerd/musicbrainz-scripts#import-ard-radio-dramas
// @downloadURL   https://raw.github.com/kellnerd/musicbrainz-scripts/main/dist/importARDRadioDramas.user.js
// @updateURL     https://raw.github.com/kellnerd/musicbrainz-scripts/main/dist/importARDRadioDramas.user.js
// @supportURL    https://github.com/kellnerd/musicbrainz-scripts/issues
// @grant         none
// @match         *://hoerspiele.dra.de/vollinfo.php
// ==/UserScript==

(function () {
	'use strict';

	const urlTypeIds = /** @type {const} */ ({
		'production': 72,
		'amazon asin': 77,
		'discography entry': 288,
		'license': 301,
		'get the music': 73,
		'purchase for mail-order': 79,
		'purchase for download': 74,
		'download for free': 75,
		'free streaming': 85,
		'streaming': 980,
		'crowdfunding page': 906,
		'show notes': 729,
		'other databases': 82,
		'discogs': 76,
		'vgmdb': 86,
		'secondhandsongs': 308,
		'allmusic': 755,
		'BookBrainz': 850,
	});

	/**
	 * Returns the first element that is a descendant of node that matches selectors.
	 * @param {string} selectors 
	 * @param {ParentNode} node 
	 */
	function qs(selectors, node = document) {
		return node.querySelector(selectors);
	}

	/**
	 * Returns all element descendants of node that match selectors.
	 * @param {string} selectors 
	 * @param {ParentNode} node 
	 */
	function qsa(selectors, node = document) {
		return node.querySelectorAll(selectors);
	}

	/**
	 * Builds an edit note for the given message sections and adds a footer section for the active userscript.
	 * Automatically de-duplicates the sections to reduce auto-generated message and footer spam.
	 * @param {...string} sections Edit note sections.
	 * @returns {string} Complete edit note content.
	 */
	function buildEditNote(...sections) {
		sections = sections.map((section) => section.trim());

		if (typeof GM_info !== 'undefined') {
			sections.push(`${GM_info.script.name} (v${GM_info.script.version}, ${GM_info.script.namespace})`);
		}

		// drop empty sections and keep only the last occurrence of duplicate sections
		return sections
			.filter((section, index) => section && sections.lastIndexOf(section) === index)
			.join(editNoteSeparator);
	}

	const editNoteSeparator = '\n—\n';

	/**
	 * Extracts the entity type and ID from a MusicBrainz URL (can be incomplete and/or with additional path components and query parameters).
	 * @param {string} url URL of a MusicBrainz entity page.
	 * @returns {{ type: CoreEntityTypeT | 'mbid', mbid: MB.MBID } | undefined} Type and ID.
	 */
	function extractEntityFromURL(url) {
		const entity = url.match(/(area|artist|event|genre|instrument|label|mbid|place|recording|release|release-group|series|url|work)\/([0-9a-f-]{36})(?:$|\/|\?)/);
		return entity ? {
			type: entity[1],
			mbid: entity[2]
		} : undefined;
	}

	/**
	 * @param {CoreEntityTypeT} entityType 
	 * @param {MB.MBID | 'add' | 'create'} mbid MBID of an existing entity or `create` for the entity creation page (`add` for releases).
	 */
	function buildEntityURL(entityType, mbid) {
		return `https://musicbrainz.org/${entityType}/${mbid}`;
	}

	/**
	 * Constructs a tooltip for the given entity.
	 * @param {MB.Entity} entity 
	 */
	function getEntityTooltip(entity) {
		let tooltip = `${entity.type}: ${entity['sort-name'] ?? entity.title}`; // fallback for releases
		if (entity.disambiguation) tooltip += ` (${entity.disambiguation})`;
		return tooltip;
	}

	/**
	 * Returns a promise that resolves after the given delay.
	 * @param {number} ms Delay in milliseconds.
	 */
	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Adapted from https://thoughtspile.github.io/2018/07/07/rate-limit-promises/

	function rateLimitedQueue(operation, interval) {
		let queue = Promise.resolve(); // empty queue is ready
		return (...args) => {
			const result = queue.then(() => operation(...args)); // queue the next operation
			queue = queue.then(() => delay(interval)); // start the next delay
			return result;
		};
	}

	/**
	 * Limits the number of requests for the given operation within a time interval.
	 * @template Params
	 * @template Result
	 * @param {(...args: Params) => Result} operation Operation that should be rate-limited.
	 * @param {number} interval Time interval (in ms).
	 * @param {number} requestsPerInterval Maximum number of requests within the interval.
	 * @returns {(...args: Params) => Promise<Result>} Rate-limited version of the given operation.
	 */
	function rateLimit(operation, interval, requestsPerInterval = 1) {
		if (requestsPerInterval == 1) {
			return rateLimitedQueue(operation, interval);
		}
		const queues = Array(requestsPerInterval).fill().map(() => rateLimitedQueue(operation, interval));
		let queueIndex = 0;
		return (...args) => {
			queueIndex = (queueIndex + 1) % requestsPerInterval; // use the next queue
			return queues[queueIndex](...args); // return the result of the operation
		};
	}

	/**
	 * Calls to the MusicBrainz API are limited to one request per second.
	 * https://musicbrainz.org/doc/MusicBrainz_API
	 */
	const callAPI = rateLimit(fetch, 1000);

	/**
	 * Requests the given entity from the MusicBrainz API.
	 * @param {string} url (Partial) URL which contains the entity type and the entity's MBID.
	 * @param {string[]} inc Include parameters which should be added to the API request.
	 * @returns {Promise<MB.Entity>}
	 */
	function fetchEntity(url, inc) {
		const entity = extractEntityFromURL(url);
		if (!entity) throw new Error('Invalid entity URL');

		const endpoint = [entity.type, entity.mbid].join('/');
		return fetchFromAPI(endpoint, {}, inc);
	}

	/**
	 * Makes a request to the MusicBrainz API of the currently used server and returns the results as JSON.
	 * @param {string} endpoint Endpoint (e.g. the entity type) which should be queried.
	 * @param {Record<string,string>} query Query parameters.
	 * @param {string[]} inc Include parameters which should be added to the query parameters.
	 */
	async function fetchFromAPI(endpoint, query = {}, inc = []) {
		if (inc.length) {
			query.inc = inc.join(' '); // spaces will be encoded as `+`
		}
		query.fmt = 'json';
		const headers = {
			'Accept': 'application/json',
			// 'User-Agent': 'Application name/<version> ( contact-url )',
		};
		const response = await callAPI(`https://musicbrainz.org/ws/2/${endpoint}?${new URLSearchParams(query)}`, { headers });
		if (response.ok) {
			return response.json();
		} else {
			throw response;
		}
	}

	/**
	 * Converts an array with a single element into a scalar.
	 * @template T
	 * @param {T | T[]} maybeArray 
	 * @returns A scalar or `undefined` if the conversion is not possible.
	 */
	function toScalar(maybeArray) {
		if (Array.isArray(maybeArray)) {
			if (maybeArray.length === 1) return maybeArray[0];
		} else {
			return maybeArray;
		}
	}

	/**
	 * Converts the name from kebab case into title case.
	 * @param {string} name
	 */
	function kebabToTitleCase(name) {
		return name.split('-')
			.map(upperCaseFirstLetter)
			.join(' ');
	}

	/** @param {string} word */
	function upperCaseFirstLetter(word) {
		return word.replace(/^./, c => c.toUpperCase());
	}

	/**
	 * Creates an input element where you can paste an MBID or an MB entity URL.
	 * It automatically validates the content on paste, loads the name of the entity and sets the MBID as a data attribute.
	 * @param {string} id ID and name of the input element.
	 * @param {CoreEntityTypeT[]} [allowedEntityTypes] Entity types which are allowed for this input, defaults to all.
	 * @param {string} [initialValue] Initial value of the input element.
	 */
	function createMBIDInput(id, allowedEntityTypes, initialValue) {
		/** @type {HTMLInputElement} */
		const mbidInput = document.createElement('input');
		mbidInput.className = 'mbid';
		mbidInput.name = mbidInput.id = id;
		mbidInput.placeholder = `MBID or URL (${allowedEntityTypes?.join('/') ?? 'any entity'})`;

		const mbidAttribute = 'data-mbid';
		const defaultEntityTypeRoute = toScalar(allowedEntityTypes) ?? 'mbid';

		if (initialValue) {
			setInputValue(initialValue);
		}

		mbidInput.addEventListener('input', async function () {
			const entity = await setInputValue(this.value.trim());
			if (entity) {
				mbidInput.dispatchEvent(new CustomEvent('mbid-input', { detail: entity }));
			}
		});

		return mbidInput;

		/** @param {string} entityURL */
		async function setInputValue(entityURL) {
			// create a complete entity identifier for an MBID only input
			if (entityURL.match(/^[0-9a-f-]{36}$/)) {
				entityURL = [defaultEntityTypeRoute, entityURL].join('/');
			}

			// reset previous validation results
			mbidInput.removeAttribute(mbidAttribute);
			mbidInput.classList.remove('error', 'success');
			mbidInput.title = '';

			// validate entity type and MBID
			try {
				const entity = extractEntityFromURL(entityURL);
				if (entity) {
					if (typeof allowedEntityTypes === 'undefined' || allowedEntityTypes.includes(entity.type)) {
						const result = await fetchEntity(entityURL);
						result.type ||= kebabToTitleCase(entity.type); // fallback for missing type
						mbidInput.setAttribute(mbidAttribute, result.id);
						mbidInput.value = result.name || result.title; // releases only have a title attribute
						mbidInput.classList.add('success');
						mbidInput.title = getEntityTooltip(result);
						return result;
					} else {
						throw new Error(`Entity type '${kebabToTitleCase(entity.type)}' is not allowed`);
					}
				}
			} catch (error) {
				mbidInput.classList.add('error');
				mbidInput.title = error.message ?? error.statusText;
			}
		}
	}

	/**
	 * @template Params
	 * @template Result
	 * @template {string | number} Key
	 */
	class FunctionCache {
		/**
		 * @param {(...params: Params) => Result | Promise<Result>} expensiveFunction Expensive function whose results should be cached.
		 * @param {Object} options
		 * @param {(...params: Params) => Key[]} options.keyMapper Maps the function parameters to the components of the cache's key.
		 * @param {string} [options.name] Name of the cache, used as storage key (optional).
		 * @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
		 * @param {Record<Key, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
		 */
		constructor(expensiveFunction, options) {
			this.expensiveFunction = expensiveFunction;
			this.keyMapper = options.keyMapper;
			this.name = options.name ?? `defaultCache`;
			this.storage = options.storage;
			this.data = options.data ?? {};
		}

		/**
		 * Looks up the result for the given parameters and returns it.
		 * If the result is not cached, it will be calculated and added to the cache.
		 * @param {Params} params 
		 */
		async get(...params) {
			const keys = this.keyMapper(...params);
			const lastKey = keys.pop();
			if (!lastKey) return;

			const record = this._get(keys);
			if (record[lastKey] === undefined) {
				// create a new entry to cache the result of the expensive function
				const newEntry = await this.expensiveFunction(...params);
				if (newEntry !== undefined) {
					record[lastKey] = newEntry;
				}
			}

			return record[lastKey];
		}

		/**
		 * Manually sets the cache value for the given key.
		 * @param {Key[]} keys Components of the key.
		 * @param {Result} value 
		 */
		set(keys, value) {
			const lastKey = keys.pop();
			this._get(keys)[lastKey] = value;
		}

		/**
		 * Loads the persisted cache entries.
		 */
		load() {
			const storedData = this.storage?.getItem(this.name);
			if (storedData) {
				this.data = JSON.parse(storedData);
			}
		}

		/**
		 * Persists all entries of the cache.
		 */
		store() {
			this.storage?.setItem(this.name, JSON.stringify(this.data));
		}

		/**
		 * Clears all entries of the cache and persists the changes.
		 */
		clear() {
			this.data = {};
			this.store();
		}

		/**
		 * Returns the cache record which is indexed by the key.
		 * @param {Key[]} keys Components of the key.
		 */
		_get(keys) {
			let record = this.data;
			keys.forEach((key) => {
				if (record[key] === undefined) {
					// create an empty record for all missing keys
					record[key] = {};
				}
				record = record[key];
			});
			return record;
		}
	}

	/**
	 * @template Params
	 * @template Result
	 * @template {string | number} Key
	 * @extends {FunctionCache<Params, Result, Key>}
	 */
	class SimpleCache extends FunctionCache {
		/**
		* @param {Object} options
		* @param {string} [options.name] Name of the cache, used as storage key (optional).
		* @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
		* @param {Record<Key, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
		*/
		constructor(options) {
			// use a dummy function to make the function cache fail without actually running an expensive function
			super((...params) => undefined, {
				...options,
				keyMapper: (...params) => params,
			});
		}
	}

	/** @type {SimpleCache<[entityType: CoreEntityTypeT, name: string], MB.MBID>} */
	const nameToMBIDCache = new SimpleCache({
		name: 'nameToMBIDCache',
		storage: window.localStorage,
	});

	/**
	 * Loads the MBIDs of cached entity names for the given release seed.
	 * @param {MB.ReleaseSeed} release 
	 * @returns Name, type and MBID (if already given or found in the cache) of the related entities.
	 */
	async function loadCachedEntitiesForRelease(release) {
		return Promise.all([
			...loadCachedArtists(release.artist_credit),
			...loadCachedLabels(release),
			...release.mediums?.flatMap(
				(medium) => medium.track?.flatMap(
					(track) => loadCachedArtists(track.artist_credit)
				) ?? []
			) ?? [],
		]).then((entities) => entities.filter((entity) => entity));
	}

	/** @param {MB.ArtistCreditSeed} artistCredit */
	function loadCachedArtists(artistCredit) {
		return artistCredit?.names.map((credit) => loadCachedMBID(credit, 'artist', credit.artist?.name ?? credit.name)) ?? [];
	}

	/** @param {MB.ReleaseSeed} release */
	function loadCachedLabels(release) {
		return release.labels?.map((label) => loadCachedMBID(label, 'label', label.name)) ?? [];
	}

	/**
	 * @param {{ mbid: MB.MBID }} entity 
	 * @param {CoreEntityTypeT} type 
	 * @param {string} name 
	 * @returns Type and name of the entity if it was not found in the cache.
	 */
	async function loadCachedMBID(entity, type, name) {
		let mbid = entity.mbid;

		if (!mbid) {
			mbid = await nameToMBIDCache.get(type, name);
			if (mbid) {
				entity.mbid = mbid;
			}
		}

		return { type, name, mbid };
	}

	/**
	 * Creates a hidden input element.
	 * @param {string} name Name of the input element.
	 * @param {string} value Value of the input element.
	 */
	function createHiddenInput(name, value) {
		const input = document.createElement('input');
		input.setAttribute('type', 'hidden');
		input.name = name;
		input.value = value;
		return input;
	}

	/**
	 * Creates a form with hidden inputs for the given data.
	 * @param {import('../types').FormDataRecord} data Record with one or multiple values for each key.
	 */
	function createHiddenForm(data) {
		const form = document.createElement('form');
		form.append(...
			Object.entries(data).flatMap(([key, value]) => {
				if (Array.isArray(value)) {
					return value.map((singleValue) => createHiddenInput(key, singleValue));
				}
				return createHiddenInput(key, value);
			})
		);
		return form;
	}

	/**
	 * Flattens the given (deep) object to a single level hierarchy.
	 * Concatenates the keys in a nested structure which lead to a value with dots.
	 * @param {object} object 
	 * @param {string[]} preservedKeys Keys whose values will be preserved.
	 * @returns {object}
	 */
	function flatten(object, preservedKeys = []) {
		const flatObject = {};

		for (const key in object) {
			let value = object[key];
			if (typeof value === 'object' && value !== null && !preservedKeys.includes(key)) { // also matches arrays
				value = flatten(value, preservedKeys);
				for (const childKey in value) {
					flatObject[key + '.' + childKey] = value[childKey]; // concatenate keys
				}
			} else { // value is already flat (e.g. a string) or should be preserved
				flatObject[key] = value; // keep the key
			}
		}

		return flatObject;
	}

	/**
	 * Creates a form with hidden inputs and a submit button to seed a new release on MusicBrainz.
	 * @param {MB.ReleaseSeed} releaseData Data of the release.
	 */
	function createReleaseSeederForm(releaseData) {
		const form = createHiddenForm(flatten(releaseData, ['type']));
		form.action = buildEntityURL('release', 'add');
		form.method = 'POST';
		form.target = '_blank';
		form.name = 'musicbrainz-release-seeder';

		const importButton = document.createElement('button');
		const icon = document.createElement('img');
		icon.src = '//musicbrainz.org/favicon.ico';
		importButton.append(icon, 'Import into MusicBrainz');
		importButton.title = 'Import this release into MusicBrainz (open a new tab)';
		form.appendChild(importButton);

		return form;
	}

	/**
	 * Creates a DOM element from the given HTML fragment.
	 * @param {string} html HTML fragment.
	 */
	function createElement(html) {
		const template = document.createElement('template');
		template.innerHTML = html;
		return template.content.firstElementChild;
	}

	/**
	 * Creates a style element from the given CSS fragment and injects it into the document's head.
	 * @param {string} css CSS fragment.
	 * @param {string} userscriptName Name of the userscript, used to generate an ID for the style element.
	 */
	function injectStylesheet(css, userscriptName) {
		const style = document.createElement('style');
		if (userscriptName) {
			style.id = [userscriptName, 'userscript-css'].join('-');
		}
		style.innerText = css;
		document.head.append(style);
	}

	/**
	 * Creates an object from the given arrays of keys and corresponding values.
	 * @param {string[]} keys
	 * @param {any[]} values
	 */
	function zipObject(keys, values) {
		return Object.fromEntries(keys.map((_, index) => [keys[index], values[index]]));
	}

	// clean up the release URL
	const releaseURL = new URL(window.location);
	const releaseId = releaseURL.searchParams.get('dukey');
	releaseURL.search = new URLSearchParams({ dukey: releaseId });

	// extract data
	const authors = Array.from(qsa('.hspaut a')).map((a) => a.textContent.trim());
	const title = qs('.hsprhti').textContent.trim();
	qs('.hspunti')?.textContent.trim();
	qs('.hsprti')?.textContent.trim();

	Array.from(qsa('.vollinfoblock p > span.prefix')).map((span) => {
		const line = span.parentNode.textContent.trim();
		return line.split(/:\s+/, 2); // split prefix (attribute name) and content (attribute values)
	});

	const voiceActorCredits = Array.from(qsa('.mitwirkende tr')).map((row) => {
		// three cells which should contain: 1. actor/actress, 2. empty, 3. role(s) or empty
		const cells = row.childNodes;
		if (cells.length !== 3 || cells[0].nodeName !== 'TD') return; // skip headers and empty rows
		return Array.from(cells).map((cell) => cell.textContent.trim()).filter((text) => text);
	}).filter((credit) => credit);

	const sidebarText = Array.from(qsa('.sectionC div:not(.noPrint) > p'))
		.filter((p) => p.childElementCount === 0) // skip headings, keep only text nodes
		.map((p) => p.textContent.trim());

	let broadcasters = [], radioEvents = [], duration = '';

	sidebarText.forEach((line) => {
		// line format: `<broadcaster> <YYYY>`, year is optional
		const productionMatch = line.match(/^(\D+?)(?:\s+(\d{4}))?$/);
		if (productionMatch) {
			broadcasters.push(...productionMatch[1].split(/\s+\/\s+/));
			productionMatch[2];
		}

		// line format: `(Deutsche) Erstsendung: <DD.MM.YYYY> | <station> | (ca.) <m'ss>`;
		// parts in parentheses, station and duration are optional
		if (/Erstsendung/.test(line)) {
			const event = {};
			line.split('|').forEach((fragment, column) => {
				const dateMatch = fragment.match(/\d{2}\.\d{2}\.\d{4}/);
				const durationMatch = fragment.match(/\d+'\d{2}/);
				if (dateMatch) {
					event.date = zipObject(['day', 'month', 'year'], dateMatch[0].split('.'));
				} else if (durationMatch) {
					duration = durationMatch[0].replace("'", ':');
				} else if (column === 1) {
					event.station = fragment.trim();
				}
			});
			radioEvents.push(event);
		}
	});

	// parse and standardize the title
	let episodeTitle = title;
	let standardizedFullTitle = title;
	let disambiguationComment;

	const episodeMatch = title.match(/(.+?)\s+\((?:(\d+)\.\s+(Folge|Teil)(?:\s+\((.+?)\))?(?::\s+)?)?(.*)?\)$/);
	if (episodeMatch) {
		standardizedFullTitle = episodeMatch[1]; // main title or series title

		const episodeNumber = episodeMatch[2];
		if (episodeNumber) {
			standardizedFullTitle += `, ${episodeMatch[3]} ${episodeNumber}`;
		}

		disambiguationComment = episodeMatch[4];
		episodeTitle = episodeMatch[5];
		if (episodeTitle) {
			standardizedFullTitle += ': ' + episodeTitle;
		}
	}

	/** @type {MB.ReleaseSeed} */
	const release = {
		name: standardizedFullTitle,
		artist_credit: {
			names: authors.map((author, index) => ({
				name: author,
				artist: {
					name: author,
				},
				join_phrase: index === authors.length - 1 ? '' : ', ',
			})),
		},
		type: ['Broadcast', 'Audio drama'],
		events: radioEvents.map(makeReleaseEvent),
		labels: broadcasters.map((name) => ({ name })),
		language: 'deu',
		script: 'Latn',
		status: 'Official',
		barcode: 'none',
		packaging: 'None',
		mediums: [{
			format: 'Digital Media',
			track: [{
				number: 1,
				name: episodeTitle ?? standardizedFullTitle,
				length: duration,
			}],
		}],
		urls: [{
			url: releaseURL.href,
			link_type: urlTypeIds['discography entry'],
		}],
		edit_note: buildEditNote(`Imported radio drama from ${releaseURL}`),
	};

	if (disambiguationComment) release.comment = disambiguationComment;


	/**
	 * @param {Object} radioEvent
	 * @param {PartialDateT} radioEvent.date
	 * @param {string} radioEvent.station
	 */
	function makeReleaseEvent(radioEvent) {
		return {
			date: radioEvent.date,
			country: getCountryOfStation(radioEvent.station),
		};
	}

	// TODO: find a list of all stations used by dra.de and improve (AT/CH/DD/LI?)
	function getCountryOfStation(station) {
		if (/\bORF\b|Ö\d/.test(station)) return 'AT';
		else if (/\bSRF\b/.test(station)) return 'CH';
		else return 'DE';
	}

	/** @param {MB.ReleaseSeed} release */
	async function injectUI(release) {
		// load the MBIDs for all cached entity names
		nameToMBIDCache.load();
		const relatedEntities = await loadCachedEntitiesForRelease(release);

		// create a table where the user can enter entity name to MBID mappings
		const entityMappings = createElement(`<table id="mbid-mapping"><caption>MUSICBRAINZ MAPPING</caption></table>`);
		relatedEntities.forEach((entity, index) => {
			const id = `mbid-mapping-${index}`;
			const tr = createElement(`<tr><td>${entity.name}</td></tr>`);
			const td = document.createElement('td');

			let initialMappingValue;
			if (entity.mbid) {
				initialMappingValue = [entity.type, entity.mbid].join('/');
			}

			const mbidInput = createMBIDInput(id, [entity.type], initialMappingValue);
			td.appendChild(mbidInput);
			tr.appendChild(td);
			entityMappings.appendChild(tr);

			// update cache and importer form if the user pasted an MBID mapping
			mbidInput.addEventListener('mbid-input', async (event) => {
				const mbid = event.detail.id;
				nameToMBIDCache.set([entity.type, entity.name], mbid);
				nameToMBIDCache.store();
				await loadCachedEntitiesForRelease(release);
				injectImporterForm();
			});
		});

		// inject into an empty sidebar section
		const importerContainer = qs('.sectionC .noPrint > p');
		importerContainer.prepend(entityMappings);
		injectImporterForm();

		// inject a button to copy credits
		/** @type {HTMLButtonElement} */
		const copyButton = createElement('<button type="button" title="Copy voice actor credits to clipboard">Copy credits</button>');
		copyButton.addEventListener('click', () => {
			navigator.clipboard?.writeText(voiceActorCredits.map((credit) => `${credit[1] ?? ''} - ${credit[0]}`).join('\n'));
		});
		copyButton.style.marginTop = '5px';
		importerContainer.appendChild(copyButton);

		function injectImporterForm() {
			const form = createReleaseSeederForm(release);
			const existingForm = qs(`form[name="${form.getAttribute('name')}"]`);

			if (existingForm) {
				existingForm.replaceWith(form);
			} else {
				importerContainer.appendChild(form);
			}
		}
	}

	const styles = `
input.error {
	background: #EBB1BA !important;
}
input.success {
	background: #B1EBB0;
}
form[name="musicbrainz-release-seeder"] button img {
	display: inline;
	vertical-align: middle;
	margin-right: 5px;
}
#mbid-mapping {
	border-spacing: revert;
}
#mbid-mapping caption {
	font-weight: bold;
}`;

	injectUI(release);
	injectStylesheet(styles, 'musicbrainz-importer');

})();
