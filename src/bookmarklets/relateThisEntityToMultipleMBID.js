/**
 * - Relates the currently edited entity to multiple entities given by their MBIDs.
 * - Uses the selected relationship type of the currently active relationship dialog.
 */

import { fetchEntity } from '../internalAPI.js';
import { createRelationship } from '../relationship-editor/createRelationship.js';

/**
 * Adds relationships of the given type between the currently edited source entity and the given target entities.
 * @param {string[]} mbids MBIDs of the target entities.
 * @param {number} linkTypeID Internal ID of the relationship type.
 * @param {boolean} [backward] Change the direction of the relationship.
 */
async function relateThisEntityToMultiple(mbids, linkTypeID, backward = false) {
	for (let mbid of mbids) {
		createRelationship({
			target: await fetchEntity(mbid),
			linkTypeID,
			backward,
		});
	}
}

const input = prompt('MBIDs of entities which should be related to this entity:');

if (input) {
	const mbids = Array.from(input.matchAll(/[0-9a-f-]{36}/gm), (match) => match[0]);
	const activeDialog = MB.relationshipEditor.relationshipDialogState;

	if (activeDialog) {
		// use the selected relationship type of the active dialog
		const linkTypeID = activeDialog.linkType.autocomplete.selectedItem.entity.id;
		relateThisEntityToMultiple(mbids, linkTypeID, activeDialog.backward);
	}
}
