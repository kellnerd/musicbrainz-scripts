// ==UserScript==
// @name         MusicBrainz: Voice actor credits
// @version      2021.10.8
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
	 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
	 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
	 * @param {Object} artistData Edit data of the performing artist (optional).
	 * @param {string} roleName Credited name of the voice actor's role (optional).
	 * @returns MusicBrainz "Add relationship" dialog.
	 */
	function createVoiceActorDialog(artistData = {}, roleName = '') {
		const viewModel = MB.releaseRelationshipEditor;
		const target = new MB.entity.Artist(artistData);
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

	const button =
`<span class="add-rel btn" id="add-voice-actor-credit">
	<img class="bottom" src="https://staticbrainz.org/MB/add-e585eab.png">
	Add voice actor relationship
</span>`	;

	function insertVoiceActorButton() {
		$(button)
			.on('click', (event) => createVoiceActorDialog().open(event))
			.appendTo('#release-rels');
	}

	insertVoiceActorButton();

}());
