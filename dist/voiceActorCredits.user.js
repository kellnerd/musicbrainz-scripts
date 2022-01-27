// ==UserScript==
// @name         MusicBrainz: Voice actor credits
// @version      2022.1.27
// @namespace    https://github.com/kellnerd/musicbrainz-bookmarklets
// @author       kellnerd
// @description  Simplifies the addition of “spoken vocals” relationships (at release level). Provides additional buttons in the relationship editor to open a pre-filled dialogue or import the credits from Discogs.
// @homepageURL  https://github.com/kellnerd/musicbrainz-bookmarklets#voice-actor-credits
// @downloadURL  https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/voiceActorCredits.user.js
// @updateURL    https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/voiceActorCredits.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-bookmarklets/issues
// @grant        none
// @run-at       document-idle
// @match        *://*.musicbrainz.org/release/*/edit-relationships
// ==/UserScript==

(function () {
	'use strict';

	/**
	 * Adds the given message and a footer for the active userscript to the edit note.
	 * @param {string} message Edit note message.
	 */
	function addMessageToEditNote(message) {
		/** @type {HTMLTextAreaElement} */
		const editNoteInput = document.querySelector('#edit-note-text, .edit-note');
		const previousContent = editNoteInput.value.split(separator);
		editNoteInput.value = buildEditNote(...previousContent, message);
		editNoteInput.dispatchEvent(new Event('change'));
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
			.join(separator);
	}

	const separator = '\n—\n';

	/**
	 * Extracts the entity type and ID from a MusicBrainz URL (can be incomplete and/or with additional path components and query parameters).
	 * @param {string} url URL of a MusicBrainz entity page.
	 * @returns {{ type: MB.EntityType, mbid: MB.MBID } | undefined} Type and ID.
	 */
	function extractEntityFromURL$1(url) {
		const entity = url.match(/(area|artist|event|genre|instrument|label|place|recording|release|release-group|series|url|work)\/([0-9a-f-]{36})(?:$|\/|\?)/);
		return entity ? {
			type: entity[1],
			mbid: entity[2]
		} : undefined;
	}

	/**
	 * @param {MB.EntityType} entityType 
	 * @param {MB.MBID} mbid 
	 */
	function buildEntityURL$1(entityType, mbid) {
		return `https://musicbrainz.org/${entityType}/${mbid}`;
	}

	/**
	 * @template Params
	 * @template Result
	 */
	class FunctionCache {
		/**
		 * @param {(...params: Params) => Result | Promise<Result>} expensiveFunction Expensive function whose results should be cached.
		 * @param {Object} options
		 * @param {(...params: Params) => string[]} options.keyMapper Maps the function parameters to the components of the cache's key.
		 * @param {string} [options.name] Name of the cache, used as storage key (optional).
		 * @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
		 * @param {Record<string, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
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
		 * @param {string[]} keys Components of the key.
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
		 * @param {string[]} keys Components of the key
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
	 * Transforms the given value using the given substitution rules.
	 * @param {string} value 
	 * @param {(string|RegExp)[][]} substitutionRules Pairs of values for search & replace.
	 * @returns {string}
	 */
	function transform(value, substitutionRules) {
		substitutionRules.forEach(([searchValue, replaceValue]) => {
			value = value.replace(searchValue, replaceValue);
		});
		return value;
	}

	const transformationRules = [
		/* quoted text */
		[/(?<=[^\p{L}\d]|^)"(.+?)"(?=[^\p{L}\d]|$)/ug, '“$1”'], // double quoted text
		[/(?<=\W|^)'(n)'(?=\W|$)/ig, '’$1’'], // special case: 'n'
		[/(?<=[^\p{L}\d]|^)'(.+?)'(?=[^\p{L}\d]|$)/ug, '‘$1’'], // single quoted text
		// ... which is enclosed by non-word characters or at the beginning/end of the title
		// [^\p{L}\d] matches Unicode characters which are neither letters nor digits (\W only works with Latin letters)

		/* primes */
		[/(\d+)"/g, '$1″'], // double primes, e.g. for 12″
		[/(\d+)'(\d+)/g, '$1′$2'], // single primes, e.g. for 3′42″ but not for 70’s

		/* apostrophes */
		[/'/g, '’'], // ... and finally the apostrophes should be remaining

		/* ellipses */
		[/(?<!\.)\.{3}(?!\.)/g, '…'], // horizontal ellipsis (but not more than three dots)

		/* dashes */
		[/ - /g, ' – '], // en dash as separator

		/* hyphens for (partial) ISO 8601 dates, e.g. 1987‐07–30 or 2016-04 */
		[/\d{4}-\d{2}(?:-\d{2})?(?=\W|$)/g, (potentialDate) => {
			if (Number.isNaN(Date.parse(potentialDate))) return potentialDate; // skip invalid date strings, e.g. 1989-90
			return potentialDate.replaceAll('-', '‐');
		}],

		/* figure dashes: separate three or more groups of digits (two groups could be range) */
		[/\d+(-\d+){2,}/g, (groupedDigits) => groupedDigits.replaceAll('-', '‒')],

		[/(\d+)-(\d+)/g, '$1–$2'], // en dash for ranges where it means "to", e.g. 1965–1972

		/* hyphens */
		[/(?<=\S)-(?=\S)/g, '‐'], // ... and finally the hyphens should be remaining

		/* rare cases where it is difficult to define precise rules: em dash, minus */
	];

	/**
	 * Searches and replaces ASCII punctuation symbols of the given text by their preferred Unicode counterparts.
	 * These can only be guessed based on context as the ASCII symbols are ambiguous.
	 * @param {string} text
	 */
	function useUnicodePunctuation(text) {
		return transform(text, transformationRules);
	}

	/**
	 * Returns a promise that resolves after the given delay.
	 * @param {number} ms Delay in milliseconds.
	 */
	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Adapted from https://thoughtspile.github.io/2018/07/07/rate-limit-promises/

	function rateLimit1(operation, interval) {
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
	 * @param {(...args:Params)=>Result} operation Operation that should be rate-limited.
	 * @param {number} interval Time interval (in ms).
	 * @param {number} requestsPerInterval Maximum number of requests within the interval.
	 * @returns {(...args:Params)=>Promise<Result>} Rate-limited version of the given operation.
	 */
	function rateLimit(operation, interval, requestsPerInterval = 1) {
		if (requestsPerInterval == 1) {
			return rateLimit1(operation, interval);
		}
		const queues = Array(requestsPerInterval).fill().map(() => rateLimit1(operation, interval));
		let queueIndex = 0;
		return (...args) => {
			queueIndex = (queueIndex + 1) % requestsPerInterval; // use the next queue
			return queues[queueIndex](...args); // return the rate-limited operation
		};
	}

	/**
	 * Calls to the Discogs API are limited to 25 unauthenticated requests per minute.
	 * https://www.discogs.com/developers/
	 */
	const callAPI$1 = rateLimit(fetch, 60 * 1000, 25);

	/**
	 * Extracts the entity type and ID from a Discogs URL.
	 * @param {string} url URL of a Discogs entity page.
	 * @returns {[Discogs.EntityType,string]|undefined} Type and ID.
	 */
	function extractEntityFromURL(url) {
		return url.match(/(artist|label|master|release)\/(\d+)/)?.slice(1);
	}

	/**
	 * @param {Discogs.EntityType} entityType 
	 * @param {number} entityId 
	 */
	function buildEntityURL(entityType, entityId) {
		return `https://www.discogs.com/${entityType}/${entityId}`;
	}

	/**
	 * Requests the given entity from the Discogs API.
	 * @param {Discogs.EntityType} entityType 
	 * @param {number} entityId 
	 */
	async function fetchEntityFromAPI(entityType, entityId) {
		const url = `https://api.discogs.com/${entityType}s/${entityId}`;
		const response = await callAPI$1(url);
		if (response.ok) {
			return response.json();
		} else {
			throw response;
		}
	}

	/**
	 * Fetches the extra artists (credits) for the given release.
	 * @param {string} releaseURL URL of a Discogs release page.
	 */
	async function fetchCredits(releaseURL) {
		const entity = extractEntityFromURL(releaseURL);
		if (entity && entity[0] === 'release') {
			/** @type {Discogs.Release} */
			const release = await fetchEntityFromAPI(...entity);
			return release.extraartists.map((artist) => {
				/** @type {Discogs.ParsedArtist} */
				const parsedArtist = { ...artist };
				// drop bracketed numeric suffixes for ambiguous artist names
				parsedArtist.name = artist.name.replace(/ \(\d+\)$/, '');

				parsedArtist.anv = useUnicodePunctuation(artist.anv || parsedArtist.name);

				// split roles with credited role names in square brackets (for convenience)
				const roleWithCredit = artist.role.match(/(.+?) \[(.+)\]$/);
				if (roleWithCredit) {
					parsedArtist.role = roleWithCredit[1];
					parsedArtist.roleCredit = useUnicodePunctuation(roleWithCredit[2]);
				}

				return parsedArtist;
			});
		} else {
			throw new Error('Invalid Discogs URL');
		}
	}

	/**
	 * Fetches the voice actor and narrator credits for the given release.
	 * @param {string} releaseURL URL of a Discogs release page.
	 */
	async function fetchVoiceActors(releaseURL) {
		return (await fetchCredits(releaseURL))
			.filter((artist) => ['Voice Actor', 'Narrator'].includes(artist.role))
			.flatMap((artist) => {
				// split artists with multiple roles into multiple credits
				const roles = artist.roleCredit.split('/');
				if (roles.length === 1) return artist;
				return roles.map((role) => ({ ...artist, roleCredit: role.trim() }));
			});
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
	function fetchEntity$1(url, inc) {
		const entity = extractEntityFromURL$1(url);
		if (!entity) throw new Error('Invalid entity URL');

		const endpoint = [entity.type, entity.mbid].join('/');
		return fetchFromAPI(endpoint, {}, inc);
	}

	/**
	 * Returns the entity of the desired type which is associated to the given resource URL.
	 * @param {MB.EntityType} entityType Desired type of the entity.
	 * @param {string} resourceURL 
	 * @returns {Promise<MB.Entity>} The first matching entity. (TODO: handle ambiguous URLs)
	 */
	async function getEntityForResourceURL(entityType, resourceURL) {
		try {
			const url = await fetchFromAPI('url', { resource: resourceURL }, [`${entityType}-rels`]);
			return url?.relations.filter((rel) => rel['target-type'] === entityType)?.[0][entityType];
		} catch (error) {
			return null;
		}
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
		const response = await callAPI(`/ws/2/${endpoint}?${new URLSearchParams(query)}`, { headers });
		if (response.ok) {
			return response.json();
		} else {
			throw response;
		}
	}

	const DISCOGS_ENTITY_TYPES = {
		artist: 'artist',
		label: 'label',
		release: 'release',
		'release_group': 'master',
	};

	/**
	 * Maps Discogs IDs to MBIDs.
	 * @param {MB.EntityType} entityType 
	 * @param {number} discogsId 
	 */
	async function discogsToMBID(entityType, discogsId) {
		const discogsType = DISCOGS_ENTITY_TYPES[entityType];
		if (!discogsType) return;

		const entity = await getEntityForResourceURL(entityType, buildEntityURL(discogsType, discogsId));
		return entity?.id;
	}

	/**
	 * Cache for the mapping of Discogs entities to the MBIDs of their equivalent entities on MusicBrainz.
	 */
	const discogsToMBIDCache = new FunctionCache(discogsToMBID, {
		keyMapper: (type, id) => [type, id],
		name: 'discogsToMBIDCache',
		storage: window.localStorage,
	});

	/**
	 * Fetches the entity with the given MBID from the internal API ws/js.
	 * @param {MB.MBID} gid MBID of the entity.
	 * @returns {Promise<MB.RE.TargetEntity>}
	 */
	async function fetchEntity(gid) {
		const result = await fetch(`/ws/js/entity/${gid}`);
		return MB.entity(await result.json()); // automatically caches entities
	}

	/**
	 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
	 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
	 * @param {Partial<MB.InternalArtist>} [artistData] Data of the performing artist (optional).
	 * @param {string} [roleName] Credited name of the voice actor's role (optional).
	 * @param {string} [artistCredit] Credited name of the performing artist (optional).
	 */
	function createVoiceActorDialog(artistData = {}, roleName = '', artistCredit = '') {
		const viewModel = MB.releaseRelationshipEditor;
		const target = MB.entity(artistData, 'artist'); // automatically caches entities with a GID (unlike `MB.entity.Artist`)
		/** @type {MB.RE.Dialog} */
		const dialog = new MB.relationshipEditor.UI.AddDialog({
			source: viewModel.source,
			target,
			viewModel,
		});

		const rel = dialog.relationship();
		rel.linkTypeID(60); // set type: performance -> performer -> vocals
		rel.entity0_credit(artistCredit);
		rel.setAttributes([{
			type: { gid: 'd3a36e62-a7c4-4eb9-839f-adfebe87ac12' }, // spoken vocals
			credited_as: roleName,
		}]);

		return dialog;
	}

	/**
	 * Resolves after the given dialog has been closed.
	 * @param {MB.RE.Dialog} dialog
	 */
	function closingDialog(dialog) {
		return new Promise((resolve) => {
			if (dialog) {
				// wait until the jQuery UI dialog has been closed
				dialog.$dialog.on('dialogclose', () => {
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	/**
	 * Opens the given dialog, focuses the autocomplete input and triggers the search.
	 * @param {MB.RE.Dialog} dialog 
	 * @param {Event} [event] Affects the position of the opened dialog (optional).
	 */
	function openDialogAndTriggerAutocomplete(dialog, event) {
		dialog.open(event);
		dialog.autocomplete.$input.focus();
		dialog.autocomplete.search();
	}

	/**
	 * Returns the target entity of the given relationship dialog.
	 * @param {MB.RE.Dialog} dialog 
	 */
	function getTargetEntity(dialog) {
		return dialog.relationship().entities() // source and target entity
			.find((entity) => entity.entityType === dialog.targetType());
	}

	/**
	 * Creates an URL to seed the editor of the given entity with the given external link.
	 * @param {MB.EntityType} type Type of the target entity.
	 * @param {MB.MBID} mbid MBID of the target entity.
	 * @param {string} url External link.
	 * @param {number} linkTypeID
	 * @param {string} [editNote]
	 */
	function seedURLForEntity(type, mbid, url, linkTypeID, editNote) {
		const seedingParams = new URLSearchParams({
			[`edit-${type}.url.0.text`]: url,
			[`edit-${type}.url.0.link_type_id`]: linkTypeID,
		});

		if (editNote) {
			seedingParams.set(`edit-${type}.edit_note`, buildEditNote(editNote));
		}

		return `${buildEntityURL$1(type, mbid)}/edit?${seedingParams}`;
	}

	/**
	 * Temporary cache for fetched entities from the ws/js API, shared with MBS.
	 */
	const entityCache = new FunctionCache(fetchEntity, {
		keyMapper: (gid) => [gid],
		data: MB.entityCache,
	});

	/**
	 * Imports all existing voice actor credits from the given Discogs release.
	 * Automatically maps Discogs entities to MBIDs where possible, asks the user to match the remaining ones.
	 * @param {string} releaseURL URL of the Discogs source release.
	 * @returns - Number of credits (total & automatically mapped).
	 * - List of unmapped entities (manually matched or skipped) for which MB does not store the Discogs URLs.
	 */
	async function importVoiceActorsFromDiscogs(releaseURL) {
		/**
		 * Unmapped entities for which MB does not store the Discogs URLs.
		 * @type {EntityMapping[]}
		 */
		const unmappedArtists = [];
		let mappedCredits = 0;

		const actors = await fetchVoiceActors(releaseURL);
		for (const actor of actors) {
			let roleName = actor.roleCredit;

			// always give Discogs narrators a role name,
			// otherwise both "Narrator" and "Voice Actors" roles are mapped to MB's "spoken vocals" rels without distinction
			if (!roleName && actor.role === 'Narrator') {
				roleName = 'Narrator'; // TODO: localize according to release language?
			}

			const artistCredit = actor.anv; // we are already using the name as a fallback
			const artistMBID = await discogsToMBIDCache.get('artist', actor.id);

			if (artistMBID) {
				// mapping already exists, automatically add the relationship
				const mbArtist = await entityCache.get(artistMBID);
				createVoiceActorDialog(mbArtist, roleName, artistCredit).accept();
				mappedCredits++;
				// duplicates of already existing rels will be merged automatically
			} else {
				// pre-fill dialog with the Discogs artist object (compatible because it also has a `name` property)
				const dialog = createVoiceActorDialog(actor, roleName, artistCredit);

				// let the user select the matching entity
				openDialogAndTriggerAutocomplete(dialog);
				await closingDialog(dialog);

				// collect mappings for freshly matched artists
				const artistMatch = getTargetEntity(dialog);
				if (artistMatch.gid) {
					discogsToMBIDCache.set(['artist', actor.id], artistMatch.gid);
				}
				unmappedArtists.push({
					MBID: artistMatch.gid,
					name: artistMatch.name,
					comment: artistMatch.comment,
					externalURL: buildEntityURL('artist', actor.id),
					externalName: actor.name,
				});
			}
		}

		// persist cache entries after each import, TODO: only do this on page unload
		discogsToMBIDCache.store();

		return {
			totalCredits: actors.length,
			mappedCredits,
			unmappedArtists,
		};
	}

	const addIcon = $('img', '.add-rel.btn').attr('src');

	const addButton =
`<span class="add-rel btn" id="add-voice-actor-credit">
	<img class="bottom" src="${addIcon}">
	Add voice actor relationship
</span>`	;

	const importButton =
`<span class="add-rel btn" id="import-voice-actors">
	<img class="bottom" src="${addIcon}">
	Import voice actors
</span>`	;

	const UI =
`<div id="credit-import-tools">
	<div id="credit-import-status" class="row no-label"></div>
	<div id="credit-import-errors" class="row no-label error"></div>
</div>`	;

	function buildUI() {
		// TODO: only show buttons for certain RG types (audiobook, audio drama, spoken word) of the MB release?
		$(addButton)
			.on('click', (event) => createVoiceActorDialog().open(event))
			.appendTo('#release-rels');

		$(importButton)
			.on('click', async () => {
				const releaseData = await fetchEntity$1(window.location.href, ['release-groups', 'url-rels']);
				const releaseURL = buildEntityURL$1('release', releaseData.id);
				let discogsURL = releaseData.relations.find((rel) => rel.type === 'discogs')?.url.resource;

				if (!discogsURL) {
					discogsURL = prompt('Discogs release URL');
				}

				if (discogsURL) {
					const result = await importVoiceActorsFromDiscogs(discogsURL);
					addMessageToEditNote(`Imported voice actor credits from ${discogsURL}`);

					// mapping suggestions
					const newMatches = result.unmappedArtists.filter((mapping) => mapping.MBID);
					const artistSeedNote = `Matching artist identified while importing credits from ${discogsURL} to ${releaseURL}`;
					const messages = newMatches.map((match) => [
						'Please add the external link',
						`<a href="${match.externalURL}" target="_blank">${match.externalName}</a>`,
						'to the matched entity:',
						`<a href="${seedURLForEntity('artist', match.MBID, match.externalURL, 180, artistSeedNote)}" target="_blank">${match.name}</a>`,
						match.comment ? `<span class="comment">(<bdi>${match.comment}</bdi>)</span>` : '',
					].join(' '));

					// import statistics
					const importedCredits = result.mappedCredits + newMatches.length;
					messages.unshift(`Successfully imported ${importedCredits} of ${result.totalCredits} credits, ${result.mappedCredits} of them were mapped automatically.`);

					$('#credit-import-status').html(messages.map((message) => `<p>${message}</p>`).join('\n'));
				}
			})
			.appendTo('#release-rels');

		$(UI).appendTo('#release-rels');
	}

	discogsToMBIDCache.load();
	buildUI();

})();
