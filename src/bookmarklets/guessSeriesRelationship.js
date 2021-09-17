/**
 * - Guesses the series name from the name of the currently edited entity and adds a relationship.
 * - Tries to extract the series number from the entity name to use it as relationship attribute.
 */

import { searchEntity } from '../api.js';
import { createAddRelationshipDialog } from '../relationshipEditor.js';

async function guessSeriesRelationship(entityName) {
	const seriesMatch = entityName.match(/(.+?)(?: (\d+))?:/);
	if (!seriesMatch) return;
	const seriesResults = await searchEntity('series', seriesMatch[1]);
	const dialog = createAddRelationshipDialog(new MB.entity(seriesResults[0]));
	const seriesNumber = seriesMatch[2];
	if (seriesNumber) {
		dialog.relationship().setAttributes([{
			type: { gid: 'a59c5830-5ec7-38fe-9a21-c7ea54f6650a' }, // number (in a series)
			text_value: seriesNumber,
		}]);
	}
	dialog.accept();
}

const entityName = document.querySelector('h1 bdi').textContent;
guessSeriesRelationship(entityName);
