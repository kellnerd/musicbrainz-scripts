import {
	fetchEntity,
} from './internalAPI.js';

/**
 * Creates a dialog to add a relationship to the currently edited source entity.
 * @param {{gid:string,name:string}} targetEntity Target entity of the relationship.
 * @returns Pre-filled "Add relationship" dialog object.
 */
export function createAddRelationshipDialog(targetEntity) {
	const viewModel = MB.sourceRelationshipEditor;
	return new MB.relationshipEditor.UI.AddDialog({
		viewModel,
		source: viewModel.source,
		target: targetEntity,
	});
}

/**
 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
 * @param {Object} artistData Edit data of the performing artist (optional).
 * @param {string} roleName Credited name of the voice actor's role (optional).
 * @param {string} artistCredit Credited name of the performing artist (optional).
 * @returns MusicBrainz "Add relationship" dialog.
 */
export function createVoiceActorDialog(artistData = {}, roleName = '', artistCredit = '') {
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
 * Creates an entity object which can be used as target of relationships.
 * @param {string} url URL of a MusicBrainz entity page.
 * @returns {Promise<{gid:string,name:string}>}
 */
export async function targetEntityFromURL(url) {
	const entity = extractEntityFromURL(url);
	return new MB.entity(await fetchEntity(entity.mbid));
}

/**
 * Extracts the entity type and ID from a MusicBrainz URL.
 * @param {string} url URL of a MusicBrainz entity page.
 * @returns {{type:string,mbid:string}|undefined} Type and ID.
 */
function extractEntityFromURL(url) {
	const entity = url.match(/(area|artist|event|genre|instrument|label|place|release|release-group|series|url|work)\/([0-9a-f-]{36})$/);
	return entity ? {
		type: entity[1],
		mbid: entity[2],
	} : undefined;
}
