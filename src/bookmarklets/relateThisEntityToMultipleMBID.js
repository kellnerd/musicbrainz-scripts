/**
 * - Relates the currently edited entity to multiple entities given by their MBIDs.
 * - Automatically uses the selected relationship type of the currently active relationship dialog.
 * - Falls back to the default relationship type between the two entity types if there is no active dialog.
 */

import { createAddRelationshipDialog } from '../relationshipEditor.js';
import { fetchEntity } from '../internalAPI.js';

/**
 * Adds relationships of the given type between the currently edited source entity and the given target entities.
 * @param {string[]} mbids MBIDs of the target entities.
 * @param {number} [relTypeId] Internal ID of the relationship type (optional, omit to use the default relationship type).
 * @param {boolean} [backward] Change the direction of the relationship.
 */
async function relateThisEntityToMultiple(mbids, relTypeId, backward = false) {
	for (let mbid of mbids) {
		const targetEntity = await fetchEntity(mbid);
		const dialog = createAddRelationshipDialog(targetEntity, backward);
		if (relTypeId) {
			const rel = dialog.relationship();
			rel.linkTypeID(relTypeId);
		}
		dialog.accept();
	}
}

const input = prompt('MBIDs of entities which should be related to this entity:');

if (input) {
	const mbids = Array.from(input.matchAll(/[0-9a-f-]{36}/gm), (match) => match[0]);
	const relEditor = MB.sourceRelationshipEditor
		// releases have multiple relationship editors, we only care about the release relationships
		?? MB.releaseRelationshipEditor;
	const activeDialog = relEditor.activeDialog();

	if (activeDialog) {
		// use the selected relationship type of the active dialog
		const selectedRel = activeDialog.relationship();
		relateThisEntityToMultiple(mbids, selectedRel.linkTypeID(), activeDialog.backward());
	} else {
		// use the default relationship type
		relateThisEntityToMultiple(mbids);
	}
}
