/**
 * - Guesses the series name from the name of the currently edited entity and adds a relationship.
 * - Tries to extract the series number from the entity name to use it as relationship attribute.
 */

import {
	createAddRelationshipDialog,
	openDialogAndTriggerAutocomplete,
} from '../relationshipEditor.js';

async function guessSeriesRelationship(entityName) {
	const seriesMatch = entityName.match(/(.+?)(?: (\d+))?:/);
	if (!seriesMatch) return;
	const dialog = createAddRelationshipDialog(MB.entity({ name: seriesMatch[1] }, 'series'));
	const seriesNumber = seriesMatch[2];
	if (seriesNumber) {
		dialog.relationship().setAttributes([{
			type: { gid: 'a59c5830-5ec7-38fe-9a21-c7ea54f6650a' }, // number (in a series)
			text_value: seriesNumber,
		}]);
	}
	openDialogAndTriggerAutocomplete(dialog);
}

const entityName = document.querySelector('h1 bdi').textContent;
guessSeriesRelationship(entityName);
