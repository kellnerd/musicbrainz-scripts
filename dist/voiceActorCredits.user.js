// ==UserScript==
// @name         MusicBrainz: Voice actor credits
// @version      2021.6.13
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
		const response = await fetch(url);
		return response.json();
	}

	async function fetchVoiceActors(releaseURL) {
		const entity = extractEntityFromURL(releaseURL);
		if (entity && entity[0] === 'release') {
			const release = await fetchEntityFromAPI(...entity);
			return release.extraartists.filter((artist) => artist.role.startsWith('Voice Actor'));
		}
	}

	/**
	 * Returns the entity of the desired type which is associated to the given ressource URL.
	 * @param {string} entityType Desired type of the entity.
	 * @param {*} resourceURL 
	 * @returns {Promise<{name:string,id:string}>} The first matching entity. (TODO: handle ambiguous URLs)
	 */
	async function getEntityForResourceURL(entityType, resourceURL) {
		const url = await fetchFromAPI('url', new URLSearchParams({ resource: resourceURL }), [`${entityType}-rels`]);
		return url?.relations.filter((rel) => rel['target-type'] === entityType)?.[0][entityType];
	}

	/**
	 * Makes a request to the MusicBrainz API of the currently used server and returns the results as JSON.
	 * @param {string} endpoint Endpoint (e.g. the entity type) which should be queried.
	 * @param {URLSearchParams} query Query parameters.
	 * @param {string[]} inc Include parameters which will should be added to the query parameters.
	 */
	async function fetchFromAPI(endpoint, query = new URLSearchParams(), inc = []) {
		if (inc.length) {
			query.append('inc', inc.join(' ')); // spaces will be encoded as `+`
		}
		query.append('fmt', 'json');
		const result = await fetch(`/ws/2/${endpoint}?${query}`);
		return result.json();
	}

	/**
	 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
	 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
	 * @param {Object} artistData Edit data of the performing artist (optional).
	 * @param {string} roleName Credited name of the voice actor's role (optional).
	 * @returns MusicBrainz "Add relationship" dialog.
	 */
	function createVoiceActorDialog(artistData = {}, roleName = '') {
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
			try {
				const mbArtist = await getEntityForResourceURL('artist', buildEntityURL('artist', actor.id));
				createVoiceActorDialog({ name: actor.name, gid: mbArtist.id }, roleName).accept();
			} catch (error) {
				// createVoiceActorDialog({ name: actor.name }, roleName).open(event);
				// TODO: wait for the dialog to be closed
			}
			//await delay(1000);
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
				const input = prompt('Discogs release URL', 'https://www.discogs.com/release/605682');
				if (input) {
					importVoiceActorsFromDiscogs(input, event);
				} else {
					createVoiceActorDialog().open(event);
				}
			})
			.appendTo('#release-rels');
	}

	insertVoiceActorButton();

}());
