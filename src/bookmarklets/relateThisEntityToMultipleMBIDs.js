/**
 * - Relates the currently edited entity to multiple entities given by their MBIDs.
 * - Automatically uses the default relationship type between the two entity types.
 */

import { createAddRelationshipDialog } from '../relationshipEditor.js';
import { fetchEntityJS } from '../api.js';

/**
 * Adds the default relationships between the currently edited source entity and the given target entities.
 * @param {string[]} mbids MBIDs of the target entities.
 */
async function relateThisEntityToMultiple(mbids) {
	for (let mbid of mbids) {
		const targetEntity = new MB.entity(await fetchEntityJS(mbid));
		const dialog = createAddRelationshipDialog(targetEntity);
		dialog.accept();
	}
}

const input = prompt('MBIDs of entities which should be related to this entity:');

if (input !== undefined) {
	const mbids = Array.from(input.matchAll(/[0-9a-f-]{36}/gm), (match) => match[0]);
	relateThisEntityToMultiple(mbids);
}
