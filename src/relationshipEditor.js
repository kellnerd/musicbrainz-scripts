import {
	extractEntityFromURL,
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
