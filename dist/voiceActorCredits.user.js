// ==UserScript==
// @name         MusicBrainz: Voice actor credits
// @version      2021.12.28
// @namespace    https://github.com/kellnerd/musicbrainz-bookmarklets
// @author       kellnerd
// @description  Simplifies the addition of “spoken vocals” relationships (at release level). Provides an additional button in the relationship editor which opens a pre-filled dialogue.
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
	 * @returns {{type:string,mbid:string}|undefined} Type and ID.
	 */
	function extractEntityFromURL$1(url) {
		const entity = url.match(/(area|artist|event|genre|instrument|label|place|release|release-group|series|url|work)\/([0-9a-f-]{36})(?:$|\/|\?)/);
		return entity ? {
			type: entity[1],
			mbid: entity[2]
		} : undefined;
	}

	// Adapted from https://thoughtspile.github.io/2018/07/07/rate-limit-promises/

	/**
	 * Returns a promise that resolves after the given delay.
	 * @param {number} ms Delay in milliseconds.
	 */
	const delay = ms => new Promise((resolve, reject) => setTimeout(resolve, ms));

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
	 * Calls to the MusicBrainz API are limited to one request per second.
	 * https://musicbrainz.org/doc/MusicBrainz_API
	 */
	const callAPI$1 = rateLimit(fetch, 1000);

	/**
	 * Requests the given entity from the MusicBrainz API.
	 * @param {string} url (Partial) URL which contains the entity type and the entity's MBID.
	 * @param {string[]} inc Include parameters which should be added to the API request.
	 */
	function fetchEntity(url, inc) {
		const entity = extractEntityFromURL$1(url);
		if (!entity) throw new Error('Invalid entity URL');

		const endpoint = [entity.type, entity.mbid].join('/');
		return fetchFromAPI(endpoint, {}, inc);
	}

	/**
	 * Returns the entity of the desired type which is associated to the given ressource URL.
	 * @param {string} entityType Desired type of the entity.
	 * @param {string} resourceURL 
	 * @returns {Promise<{name:string,id:string}>} The first matching entity. (TODO: handle ambiguous URLs)
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
		const response = await callAPI$1(`/ws/2/${endpoint}?${new URLSearchParams(query)}`, { headers });
		if (response.ok) {
			return response.json();
		} else {
			throw response;
		}
	}

	/**
	 * Creates a function that maps entries of an input record to different property names of the output record according
	 * to the given mapping. Only properties with an existing mapping will be copied.
	 * @param {Record<string,string>} mapping Maps property names of the output record to those of the input record.
	 * @returns {(input:Record<string,any>)=>Record<string,any>} Mapper function.
	 */
	function createRecordMapper(mapping) {
		return function (input) {
			/** @type {Record<string,any>} */
			let output = {};
			for (let outputProperty in mapping) {
				const inputProperty = mapping[outputProperty];
				const value = input[inputProperty];
				if (value !== undefined) {
					output[outputProperty] = value;
				}
			}
			return output;
		};
	}

	/**
	 * Maps ws/js internal fields for an artist to ws/2 fields (from an API response).
	 */
	const ARTIST_INTERNAL_FIELDS = {
		gid: 'id', // MBID
		name: 'name',
		sort_name: 'sort-name',
		comment: 'disambiguation',
	};

	/**
	 * Creates a ws/js compatible artist object from an API response.
	 */
	const internalArtist = createRecordMapper(ARTIST_INTERNAL_FIELDS);

	/**
	 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
	 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
	 * @param {Object} artistData Edit data of the performing artist (optional).
	 * @param {string} roleName Credited name of the voice actor's role (optional).
	 * @param {string} artistCredit Credited name of the performing artist (optional).
	 * @returns MusicBrainz "Add relationship" dialog.
	 */
	function createVoiceActorDialog(artistData = {}, roleName = '', artistCredit = '') {
		const viewModel = MB.releaseRelationshipEditor;
		let target = new MB.entity(artistData, 'artist'); // automatically caches entities (unlike `MB.entity.Artist`)
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
	 * Ensures that the given relationship editor has no active dialog.
	 */
	function ensureNoActiveDialog(editor = MB.releaseRelationshipEditor) {
		return new Promise((resolve) => {
			const activeDialog = editor.activeDialog();
			if (activeDialog) {
				// wait until the jQuery UI dialog has been closed
				activeDialog.$dialog.on('dialogclose', () => {
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	/**
	 * Opens the given dialog, focuses the autocomplete input and triggers the search.
	 * @param {*} dialog 
	 * @param {Event} event Affects the position of the opened dialog.
	 */
	function openDialogAndTriggerAutocomplete(dialog, event = document.createEvent('MouseEvent')) {
		dialog.open(event);
		dialog.autocomplete.$input.focus();
		dialog.autocomplete.search();
	}

	/**
	 * Calls to the Discogs API are limited to 25 unauthenticated requests per minute.
	 * https://www.discogs.com/developers/
	 */
	const callAPI = rateLimit(fetch, 60 * 1000, 25);

	/**
	 * Extracts the entity type and ID from a Discogs URL.
	 * @param {string} url URL of a Discogs entity page.
	 * @returns {[string,string]|undefined} Type and ID.
	 */
	function extractEntityFromURL(url) {
		return url.match(/(artist|label|master|release)\/(\d+)$/)?.slice(1);
	}

	function buildEntityURL(entityType, entityId) {
		return `https://www.discogs.com/${entityType}/${entityId}`;
	}

	async function fetchEntityFromAPI(entityType, entityId) {
		const url = `https://api.discogs.com/${entityType}s/${entityId}`;
		const response = await callAPI(url);
		if (response.ok) {
			return response.json();
		} else {
			throw response;
		}
	}

	/**
	 * Fetches the extra artists (credits) for the given release.
	 * @param {string} releaseURL URL of a Discogs release page.
	 * @returns {Promise<Artist[]>}
	 */
	async function fetchCredits(releaseURL) {
		const entity = extractEntityFromURL(releaseURL);
		if (entity && entity[0] === 'release') {
			/** @type {Release} */
			const release = await fetchEntityFromAPI(...entity);
			return release.extraartists.map((artist) => {
				// split roles with credited role names in square brackets (for convenience)
				const roleWithCredit = artist.role.match(/(.+?) \[(.+)\]$/);
				if (roleWithCredit) {
					artist.role = roleWithCredit[1];
					artist.roleCredit = roleWithCredit[2];
				}
				return artist;
			});
		} else {
			throw new Error('Invalid Discogs URL');
		}
	}

	async function fetchVoiceActors(releaseURL) {
		return (await fetchCredits(releaseURL)).filter((artist) => ['Voice Actor', 'Narrator'].includes(artist.role));
	}


	/* Type definitions for IntelliSense (WIP) */

	/**
	 * @typedef Release
	 * @property {string} title
	 * @property {number} id
	 * @property {Artist[]} artists
	 * @property {Artist[]} extraartists Extra artists (credits).
	 */

	/**
	 * @typedef Artist
	 * @property {string} name Main artist name.
	 * @property {string} anv Artist name variation, empty if no name variation is used.
	 * @property {string} join
	 * @property {string} role Role of the artist, may contain the role as credited in square brackets.
	 * @property {string} [roleCredit] Role name as credited (custom extension for convenience).
	 * @property {string} tracks
	 * @property {number} id
	 * @property {string} resource_url API URL of the artist.
	 */

	async function importVoiceActorsFromDiscogs(releaseURL, event) {
		const actors = await fetchVoiceActors(releaseURL);
		for (const actor of actors) {
			let roleName = actor.roleCredit;

			// always give Discogs narrators a role name,
			// otherwise both "Narrator" and "Voice Actors" roles are mapped to MB's "spoken vocals" rels without distinction
			if (!roleName && actor.role === 'Narrator') {
				roleName = 'Narrator'; // TODO: localize according to release language?
			}

			const artistCredit = actor.anv || actor.name; // ANV is empty if it is the same as the main name
			const mbArtist = await getEntityForResourceURL('artist', buildEntityURL('artist', actor.id));
			// TODO: use a cache for the Discogs->MB artist mappings

			await ensureNoActiveDialog();

			if (mbArtist) {
				createVoiceActorDialog(internalArtist(mbArtist), roleName, artistCredit).accept();
				// TODO: catch exception which occurs for duplicate rels
			} else {
				console.info('Failed to find the linked MB artist for:', actor);
				// pre-fill dialog with the Discogs artist object (compatible because it also has a `name` property)
				const dialog = createVoiceActorDialog(actor, roleName, artistCredit);
				openDialogAndTriggerAutocomplete(dialog, event);
			}
		}
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

	function insertVoiceActorButtons() {
		// TODO: only show buttons for certain RG types (audiobook, audio drama, spoken word) of the MB release?
		$(addButton)
			.on('click', (event) => createVoiceActorDialog().open(event))
			.appendTo('#release-rels');
		$(importButton)
			.on('click', async (event) => {
				const releaseData = await fetchEntity(window.location.href, ['release-groups', 'url-rels']);
				let discogsURL = releaseData.relations.find((rel) => rel.type === 'discogs')?.url.resource;

				if (!discogsURL) {
					discogsURL = prompt('Discogs release URL');
				}

				if (discogsURL) {
					importVoiceActorsFromDiscogs(discogsURL, event);
					addMessageToEditNote(`Imported voice actor credits from ${discogsURL}`);
				}
			})
			.appendTo('#release-rels');
	}

	insertVoiceActorButtons();

}());
