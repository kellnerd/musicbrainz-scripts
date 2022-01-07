/**
 * - Extracts all copyright and legal information from the given text.
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
 * @param {import('../parseCopyrightNotice.js').CopyrightItem[]} copyrightInfo List of copyright items.
 */
async function addCopyrightRelationships(copyrightInfo) {
	for (const copyrightItem of copyrightInfo) {
		const entityType = 'label';
		const relTypes = LINK_TYPES.release[entityType];
		const targetEntity = MB.entity({ name: copyrightItem.name, entityType });
		for (const type of copyrightItem.types) {
			const dialog = createAddRelationshipDialog(targetEntity);
			const rel = dialog.relationship();
			rel.linkTypeID(relTypes[type]);
			rel.entity0_credit(copyrightItem.name);
			if (copyrightItem.year) {
				rel.begin_date.year(copyrightItem.year);
				rel.end_date.year(copyrightItem.year);
			}

			openDialogAndTriggerAutocomplete(dialog);
			await closingDialog(dialog);
		}
	}
}

const input = prompt('Copyright notice:');

if (input) {
	const copyrightInfo = parseCopyrightNotice(input);
	addCopyrightRelationships(copyrightInfo);
}
