import { entityCache } from './entityCache.js';
import { nameToMBIDCache } from './nameToMBIDCache.js';
import { searchEntity } from './internalAPI.js';
import { LINK_TYPES } from './relationshipData.js';
import {
	closingDialog,
	createAddRelationshipDialog,
	createBatchAddRelationshipsDialog,
	getTargetEntity,
	openDialogAndTriggerAutocomplete,
} from './relationshipEditor.js';

/**
 * Creates and fills an "Add relationship" dialog for each piece of copyright information.
 * Lets the user choose the appropriate target label and waits for the dialog to close before continuing with the next one.
 * Automatically chooses the first search result and accepts the dialog in automatic mode.
 * @param {CopyrightItem[]} copyrightInfo List of copyright items.
 * @param {boolean} [automaticMode] Automatic mode, disabled by default.
 * @returns Whether a relationships has been added successfully.
 */
export async function addCopyrightRelationships(copyrightInfo, automaticMode = false) {
	const selectedRecordings = MB.relationshipEditor.UI.checkedRecordings();
	let addedRelCount = 0;

	for (const copyrightItem of copyrightInfo) {
		const entityType = 'label';
		const releaseRelTypes = LINK_TYPES.release[entityType];
		const recordingRelTypes = LINK_TYPES.recording[entityType];

		/**
		 * There are multiple ways to fill the relationship's target entity:
		 * (1) Directly map the name to an MBID (if the name is already cached).
		 * (2) Select the first search result for the name (in automatic mode).
		 * (3) Just fill in the name and let the user select an entity (in manual mode).
		 */
		const targetMBID = await nameToMBIDCache.get(entityType, copyrightItem.name); // (1a)
		let targetEntity = targetMBID
			? await entityCache.get(targetMBID) // (1b)
			: MB.entity(automaticMode
				? (await searchEntity(entityType, copyrightItem.name))[0] // (2a)
				: { name: copyrightItem.name, entityType } // (3a)
			);

		for (const type of copyrightItem.types) {
			// add all copyright rels to the release
			const dialog = createAddRelationshipDialog(targetEntity);
			targetEntity = await fillAndProcessDialog(dialog, copyrightItem, releaseRelTypes[type], targetEntity);

			// also add phonographic copyright rels to all selected recordings
			if (type === '℗' && selectedRecordings.length) {
				const recordingsDialog = createBatchAddRelationshipsDialog(targetEntity, selectedRecordings);
				targetEntity = await fillAndProcessDialog(recordingsDialog, copyrightItem, recordingRelTypes[type], targetEntity);
			}
		}
	}

	return !!addedRelCount;

	/**
	 * @param {MB.RE.Dialog} dialog 
	 * @param {CopyrightItem} copyrightItem 
	 * @param {number} relTypeId 
	 * @param {MB.RE.Target<MB.RE.MinimalEntity>} targetEntity 
	 * @returns {Promise<MB.RE.TargetEntity>}
	 */
	async function fillAndProcessDialog(dialog, copyrightItem, relTypeId, targetEntity) {
		const rel = dialog.relationship();
		rel.linkTypeID(relTypeId);
		rel.entity0_credit(copyrightItem.name);
		if (copyrightItem.year) {
			rel.begin_date.year(copyrightItem.year);
			rel.end_date.year(copyrightItem.year);
		}

		if (targetEntity.gid || automaticMode) { // (1c) & (2b)
			dialog.accept();
			addedRelCount++;
		} else { // (3b)
			openDialogAndTriggerAutocomplete(dialog);
			await closingDialog(dialog);

			// remember the entity which the user has chosen for the given name
			targetEntity = getTargetEntity(dialog);
			if (targetEntity.gid) {
				nameToMBIDCache.set([targetEntity.entityType, copyrightItem.name], targetEntity.gid);
				addedRelCount++;
			}
		}
		return targetEntity;
	}
}

/**
 * @typedef {import('./parseCopyrightNotice.js').CopyrightItem} CopyrightItem
 */
