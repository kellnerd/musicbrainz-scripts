/**
 * - Extracts all copyright and legal information from the given text.
 * - Automates the process of creating release-label relationships for these.
 * - Also creates phonographic copyright relationships for all selected recordings (userscript only).
 * - Detects artists who own the copyright of their own release and adds artist relationships for these (userscript only).
 * - See the [wiki page](https://github.com/kellnerd/musicbrainz-scripts/wiki/Parse-Copyright-Notices) for more details.
 */

import { parseCopyrightNotice } from '../parseCopyrightNotice.js';
import { LINK_TYPES } from '../relationship-editor/linkTypes.js';
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

			// do not fill the date if there are multiple unspecific years
			if (copyrightItem.year && !Array.isArray(copyrightItem.year)) {
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
