import { entityCache } from './entityCache.js';
import { nameToMBIDCache } from './nameToMBIDCache.js';
import { searchEntity } from './internalAPI.js';
import { LINK_TYPES } from './relationshipData.js';
import {
	closingDialog,
	createAddRelationshipDialog,
	getTargetEntity,
	openDialogAndTriggerAutocomplete,
} from './relationshipEditor.js';

/**
 * Creates and fills an "Add relationship" dialog for each piece of copyright information.
 * Lets the user choose the appropriate target label and waits for the dialog to close before continuing with the next one.
 * Automatically chooses the first search result and accepts the dialog in automatic mode.
 * @param {import('./parseCopyrightNotice.js').CopyrightData[]} data List of copyright information.
 * @param {boolean} [automaticMode] Automatic mode, disabled by default.
 */
export async function addCopyrightRelationships(data, automaticMode = false) {
	for (const entry of data) {
		const entityType = 'label';
		const relTypes = LINK_TYPES.release[entityType];

		/**
		 * There are multiple ways to fill the relationship's target entity:
		 * (1) Directly map the name to an MBID (if the name is already cached).
		 * (2) Select the first search result for the name (in automatic mode).
		 * (3) Just fill in the name and let the user select an entity (in manual mode).
		 */
		const targetMBID = await nameToMBIDCache.get(entityType, entry.name); // (1a)
		let targetEntity = targetMBID
			? await entityCache.get(targetMBID) // (1b)
			: MB.entity(automaticMode
				? (await searchEntity(entityType, entry.name))[0] // (2a)
				: { name: entry.name, entityType } // (3a)
			);

		for (const type of entry.types) {
			const dialog = createAddRelationshipDialog(targetEntity);
			const rel = dialog.relationship();
			rel.linkTypeID(relTypes[type]);
			rel.entity0_credit(entry.name);
			if (entry.year) {
				rel.begin_date.year(entry.year);
				rel.end_date.year(entry.year);
			}

			if (targetMBID || automaticMode) { // (1c) & (2b)
				dialog.accept();
			} else { // (3b)
				openDialogAndTriggerAutocomplete(dialog);
				await closingDialog(dialog);

				// remember the entity which the user has chosen for the given name
				targetEntity = getTargetEntity(dialog);
				if (targetEntity.gid) {
					nameToMBIDCache.set([entityType, entry.name], targetEntity.gid);
				}
			}
		}
	}
}
