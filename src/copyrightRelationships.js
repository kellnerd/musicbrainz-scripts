import { entityCache } from './entityCache.js';
import { nameToMBIDCache } from './nameToMBIDCache.js';
import { getLinkTypeId } from './relationshipData.js';
import {
	closingDialog,
	createAddRelationshipDialog,
	createBatchAddRelationshipsDialog,
	getTargetEntity,
	openDialogAndTriggerAutocomplete,
} from './relationshipEditor.js';
import { preferArray } from '../utils/array/scalar.js';
import { simplifyName } from '../utils/string/simplify.js';

/**
 * Creates and fills an "Add relationship" dialog for each piece of copyright information.
 * Lets the user choose the appropriate target label or artist and waits for the dialog to close before continuing with the next one.
 * @param {CopyrightItem[]} copyrightInfo List of copyright items.
 * @param {object} [customOptions]
 * @param {boolean} [customOptions.bypassCache] Bypass the name to MBID cache to overwrite wrong entries, disabled by default.
 * @param {boolean} [customOptions.forceArtist] Force names to be treated as artist names, disabled by default.
 * @param {boolean} [customOptions.useAllYears] Adds one (release) relationship for each given year instead of a single undated relationship, disabled by default.
 * @returns {Promise<CreditParserLineStatus>} Status of the given copyright info (Have relationships been added for all copyright items?).
 */
export async function addCopyrightRelationships(copyrightInfo, customOptions = {}) {
	// provide default options
	const options = {
		bypassCache: false,
		forceArtist: false,
		useAllYears: false,
		...customOptions,
	};

	const releaseArtistNames = MB.releaseRelationshipEditor.source.artistCredit.names // all release artists
		.flatMap((name) => [name.name, name.artist.name]) // entity name & credited name (possible redundancy doesn't matter)
		.map(simplifyName);
	const selectedRecordings = MB.relationshipEditor.UI.checkedRecordings();
	let addedRelCount = 0;
	let skippedDialogs = false;

	for (const copyrightItem of copyrightInfo) {
		// detect artists who own the copyright of their own release
		const entityType = options.forceArtist || releaseArtistNames.includes(simplifyName(copyrightItem.name)) ? 'artist' : 'label';

		/**
		 * There are multiple ways to fill the relationship's target entity:
		 * (1) Directly map the name to an MBID (if the name is already cached).
		 * (2) Just fill in the name and let the user select an entity (in manual mode or when the cache is bypassed).
		 */
		const targetMBID = !options.bypassCache && await nameToMBIDCache.get(entityType, copyrightItem.name); // (1a)
		let targetEntity = targetMBID
			? await entityCache.get(targetMBID) // (1b)
			: MB.entity({ name: copyrightItem.name, entityType }); // (2a)

		for (const type of copyrightItem.types) {
			// add all copyright rels to the release
			try {
				const relTypeId = getLinkTypeId(entityType, 'release', type);
				let years = preferArray(copyrightItem.year);

				// do not use all years if there are multiple unspecific ones (unless enabled)
				if (years.length !== 1 && !options.useAllYears) {
					years = [undefined]; // prefer a single undated relationship
				}

				for (const year of years) {
					const dialog = createAddRelationshipDialog(targetEntity);
					targetEntity = await fillAndProcessDialog(dialog, { ...copyrightItem, year }, relTypeId, targetEntity);
				}
			} catch (error) {
				console.warn(`Skipping copyright item for '${copyrightItem.name}':`, error.message);
				skippedDialogs = true;
			}

			// also add phonographic copyright rels to all selected recordings
			if (type === '℗' && selectedRecordings.length) {
				try {
					const relTypeId = getLinkTypeId(entityType, 'recording', type);
					const recordingsDialog = createBatchAddRelationshipsDialog(targetEntity, selectedRecordings);
					targetEntity = await fillAndProcessDialog(recordingsDialog, copyrightItem, relTypeId, targetEntity);
				} catch (error) {
					console.warn(`Skipping copyright item for '${copyrightItem.name}':`, error.message);
					skippedDialogs = true;
				}
			}
		}
	}

	return addedRelCount > 0 ? (skippedDialogs ? 'partial' : 'done') : 'skipped';

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

		// do not fill the date if there are multiple unspecific years
		if (copyrightItem.year && !Array.isArray(copyrightItem.year)) {
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
				nameToMBIDCache.set([targetEntity.entityType, rel.entity0_credit() || targetEntity.name], targetEntity.gid);
				addedRelCount++;
			} else {
				skippedDialogs = true;
			}
		}
		return targetEntity;
	}
}
