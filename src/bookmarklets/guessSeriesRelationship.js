/**
 * - Guesses the series name from the name of the currently edited entity and adds a relationship.
 * - Tries to extract the series number from the entity name to use it as relationship attribute.
 * - Currently limited to release groups, both via their edit pages and via the release relationship editor.
 */

import { createDialog } from '../relationship-editor/createDialog.js';

async function guessSeriesRelationship(entityName) {
	const seriesMatch = entityName.match(/(.+?)(?: (\d+))?:/);
	if (!seriesMatch) return;
	
	const sourceEntity = MB.relationshipEditor.state.entity;

	createDialog({
		source: sourceEntity.releaseGroup ?? sourceEntity, // prefer the RG for releases
		target: seriesMatch[1],
		targetType: 'series',
		linkTypeId: 742, // depends on the target entity type, for RGs only so far
		attributes: [{
			type: { gid: 'a59c5830-5ec7-38fe-9a21-c7ea54f6650a' }, // number (in a series)
			text_value: seriesMatch[2],
		}],
	});
}

const entityName = document.querySelector('h1 bdi').textContent;
guessSeriesRelationship(entityName);
