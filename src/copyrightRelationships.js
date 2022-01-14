import { entityCache } from './entityCache.js';
import { nameToMBIDCache } from './nameToMBIDCache.js';
import { normalizeName } from './normalizeName.js';
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
 * @param {CopyrightItem[]} copyrightInfo List of copyright items.
 * @param {boolean} [bypassCache] Bypass the name to MBID cache to overwrite wrong entries, disabled by default.
 * @returns Whether a relationships has been added successfully.
 */
export async function addCopyrightRelationships(copyrightInfo, bypassCache = false) {
	const releaseArtistNames = MB.releaseRelationshipEditor.source.artistCredit.names // all release artists
		.flatMap((name) => [name.name, name.artist.name]) // entity name & credited name (possible redundancy doesn't matter)
		.map(normalizeName);
	const selectedRecordings = MB.relationshipEditor.UI.checkedRecordings();
	let addedRelCount = 0;

	for (const copyrightItem of copyrightInfo) {
		// detect artists who own the copyright of their own release
		const entityType = releaseArtistNames.includes(normalizeName(copyrightItem.name)) ? 'artist' : 'label';
		const releaseRelTypes = LINK_TYPES.release[entityType];
		const recordingRelTypes = LINK_TYPES.recording[entityType];

		/**
		 * There are multiple ways to fill the relationship's target entity:
		 * (1) Directly map the name to an MBID (if the name is already cached).
		 * (2) Just fill in the name and let the user select an entity (in manual mode or when the cache is bypassed).
		 */
		const targetMBID = !bypassCache && await nameToMBIDCache.get(entityType, copyrightItem.name); // (1a)
		let targetEntity = targetMBID
			? await entityCache.get(targetMBID) // (1b)
			: MB.entity({ name: copyrightItem.name, entityType }); // (2a)

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

		if (targetEntity.gid) { // (1c)
			dialog.accept();
			addedRelCount++;
		} else { // (2b)
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
