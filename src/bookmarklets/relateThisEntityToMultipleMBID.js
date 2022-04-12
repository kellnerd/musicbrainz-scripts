/**
 * - Relates the currently edited entity to multiple entities given by their MBIDs.
 * - Automatically uses the default relationship type between the two entity types.
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
	relateThisEntityToMultiple(mbids);
	// relateThisEntityToMultiple(mbids, 894, true); // RGs "included in" this RG
}
