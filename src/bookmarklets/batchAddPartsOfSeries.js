/**
 * - Batch-adds entities as parts of the currently edited series.
 * - Automatically extracts numbers from titles and uses them as relationship attributes.
 */

import { createAddRelationshipDialog } from '../relationshipEditor.js';
import { fetchEntity } from '../internalAPI.js';

/**
 * Adds the default relationships between the currently edited source entity and the given target entities.
 * The source entity is assumed to be a series, the target entities should have the correct type to be added as parts.
 * @param {string[]} mbids MBIDs of the target entities.
 */
async function relateThisSeriesToParts(mbids) {
	for (let mbid of mbids) {
		const targetEntity = new MB.entity(await fetchEntity(mbid));
		const dialog = createAddRelationshipDialog(targetEntity);
		const seriesNumberMatch = targetEntity.name.match(/\d+/);
		if (seriesNumberMatch) {
			dialog.relationship().setAttributes([{
				type: { gid: 'a59c5830-5ec7-38fe-9a21-c7ea54f6650a' }, // number (in a series)
				text_value: seriesNumberMatch[0],
			}]);
		}
		dialog.accept();
	}
}

const input = prompt('MBIDs of entities which should be added as parts of the series:');

if (input) {
	const mbids = Array.from(input.matchAll(/[0-9a-f-]{36}/gm), (match) => match[0]);
	relateThisSeriesToParts(mbids);
}
