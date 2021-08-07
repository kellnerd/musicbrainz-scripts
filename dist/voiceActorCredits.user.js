// ==UserScript==
// @name         MusicBrainz: Voice actor credits
// @version      2021.8.7
// @namespace    https://github.com/kellnerd/musicbrainz-bookmarklets
// @author       kellnerd
// @description  Simplifies the addition of “spoken vocals” relationships (at release level). Provides an additional button in the relationship editor which opens a pre-filled dialogue.
// @homepageURL  https://github.com/kellnerd/musicbrainz-bookmarklets#voice-actor-credits
// @downloadURL  https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/voiceActorCredits.user.js
// @updateURL    https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/voiceActorCredits.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-bookmarklets/issues
// @grant        none
// @match        *://*.musicbrainz.org/release/*/edit-relationships
// ==/UserScript==

(function () {
	'use strict';

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
	 * Calls to the Discogs API are limited to 25 unauthenticated requests per minute.
	 * https://www.discogs.com/developers/
	 */
	const callAPI$1 = rateLimit(fetch, 60 * 1000, 25);

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
		const response = await callAPI$1(url);
		if (response.ok) {
			return response.json();
		} else {
			throw response;
		}
	}

	async function fetchVoiceActors(releaseURL) {
		const entity = extractEntityFromURL(releaseURL);
		if (entity && entity[0] === 'release') {
			const release = await fetchEntityFromAPI(...entity);
			return release.extraartists.filter((artist) => artist.role.startsWith('Voice Actor'));
		}
	}

	/**
	 * Calls to the MusicBrainz API are limited to one request per second.
	 * https://musicbrainz.org/doc/MusicBrainz_API
	 */
	const callAPI = rateLimit(fetch, 1000);

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
		const response = await callAPI(`/ws/2/${endpoint}?${new URLSearchParams(query)}`, { headers });
		if (response.ok) {
			return response.json();
		} else {
			throw response;
		}
	}

	async function searchEntity(entityType, query) {
		const result = await fetch(`/ws/js/${entityType}?q=${encodeURIComponent(query)}`);
		return result.json();
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
		// let target = MB.entity({ entityType: 'artist', ...artistData });
		let target = new MB.entity.Artist(artistData);
		artistData.gid;
		// TODO: target.gid selects the correct artist but the name has to filled manually and is not highlighted green
		/* if (gid) {
			// probably the display issue is related to the caching of entities, code below does not help
			MB.entityCache[gid] = target = await fetchEntityJS(gid);
			// https://github.com/loujine/musicbrainz-scripts/blob/333a5f7c0a55454080c730b0eb7a22446d48d371/mb-reledit-guess_works.user.js#L54-L56
			target.relationships.forEach((rel) => {
				// apparently necessary to fill MB.entityCache with rels
				MB.getRelationship(rel, target);
			});
		} */
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

	async function importVoiceActorsFromDiscogs(releaseURL, event = document.createEvent('MouseEvent')) {
		/** @type {[{name:string,anv:string,role:string,id:number,join:string,resource_url:string,tracks:string}]} */
		const actors = await fetchVoiceActors(releaseURL);
		for (const actor of actors) {
			console.info(actor);
			const roleName = actor.role.match(/\[(.+)\]/)?.[1] || '';
			const artistCredit = actor.anv || actor.name; // ANV is empty if it is the same as the main name
			const mbArtist = await getEntityForResourceURL('artist', buildEntityURL('artist', actor.id));
			if (mbArtist) {
				createVoiceActorDialog(internalArtist(mbArtist), roleName, artistCredit).accept();
			} else {
				console.warn(`Failed to add credit '${roleName}' for '${actor.name} => Guessing...'`);
				const mbArtistGuess = (await searchEntity('artist', actor.name))[0]; // first result
				createVoiceActorDialog(mbArtistGuess, roleName, artistCredit).accept();
				// .open(event);
				// TODO: wait for the dialog to be closed
			}
		}
	}

	const button =
`<span class="add-rel btn" id="add-voice-actor-credit">
	<img class="bottom" src="https://staticbrainz.org/MB/add-384fe8d.png">
	Add voice actor relationship
</span>`	;

	function insertVoiceActorButton() {
		$(button)
			.on('click', (event) => {
				// const input = prompt('Discogs release URL', 'https://www.discogs.com/release/605682');
				const input = 'https://www.discogs.com/release/605682';
				{
					importVoiceActorsFromDiscogs(input, event);
				}
			})
			.appendTo('#release-rels');
	}

	insertVoiceActorButton();

}());
