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
