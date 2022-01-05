/**
 * - Extracts all copyright data and legal information from the given text.
 * - Assists the user to create release-label relationships for these.
 */

import { parseCopyrightNotice } from '../parseCopyrightNotice.js';
import { LINK_TYPES } from '../relationshipData.js';
import {
	closingDialog,
	createAddRelationshipDialog,
	openDialogAndTriggerAutocomplete,
} from '../relationshipEditor.js';

/**
 * Creates and fills an "Add relationship" dialog for each piece of copyright information.
 * Lets the user choose the appropriate target label and waits for the dialog to close before continuing with the next one.
 * 
 * Light version without automatic mode and caching, to reduce bookmarklet size.
 * @param {CopyrightData[]} data List of copyright information.
 */
async function addCopyrightRelationships(data) {
	for (const entry of data) {
		const entityType = 'label';
		const relTypes = LINK_TYPES.release[entityType];
		const targetEntity = MB.entity({ name: entry.name, entityType });
		for (const type of entry.types) {
			const dialog = createAddRelationshipDialog(targetEntity);
			const rel = dialog.relationship();
			rel.linkTypeID(relTypes[type]);
			rel.entity0_credit(entry.name);
			if (entry.year) {
				rel.begin_date.year(entry.year);
				rel.end_date.year(entry.year);
			}

			openDialogAndTriggerAutocomplete(dialog);
			await closingDialog(dialog);
		}
	}
}

const input = prompt('Copyright notice:');

if (input) {
	const copyrightData = parseCopyrightNotice(input);
	addCopyrightRelationships(copyrightData);
}
