/**
 * - Batch-adds release groups as parts of the currently edited series.
 * - Automatically extracts numbers from titles and uses them as relationship attributes.
 */

import { fetchEntity } from '../internalAPI.js';
import { createAttributeTree, createRelationship } from '../relationship-editor/createRelationship.js';

/**
 * Adds the default relationships between the currently edited source entity and the given target entities.
 * The source entity is assumed to be a series, the target entities should have the correct type to be added as parts.
 * @param {string[]} mbids MBIDs of the target entities.
 */
async function relateThisSeriesToParts(mbids) {
	for (let mbid of mbids) {
		const targetEntity = await fetchEntity(mbid);
		const seriesNumberMatch = targetEntity.name.match(/\d+/)?.[0];

		createRelationship({
			target: targetEntity,
			linkTypeID: 742, // depends on the target entity type, for RGs only so far
			attributes: createAttributeTree({
				type: { gid: 'a59c5830-5ec7-38fe-9a21-c7ea54f6650a' }, // number (in a series)
				text_value: seriesNumberMatch ?? '',
			}),
		});
	}
}

const input = prompt('MBIDs of RGs which should be added as parts of the series:');

if (input) {
	const mbids = Array.from(input.matchAll(/[0-9a-f-]{36}/gm), (match) => match[0]);
	relateThisSeriesToParts(mbids);
}
