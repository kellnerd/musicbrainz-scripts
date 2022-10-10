import { createDatePeriodForYear } from './common.js';
import {
	closingDialog,
	createBatchDialog,
	createDialog,
	creditTargetAs,
	setYear,
} from './createDialog.js';
import { batchCreateRelationships, createRelationship } from './createRelationship.js';
import { entityCache } from '../entityCache.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import { getLinkTypeId } from '../relationshipData.js';
import { preferArray } from '../../utils/array/scalar.js';
import { simplifyName } from '../../utils/string/simplify.js';

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

	/** @type {ReleaseT} */
	const release = MB.getSourceEntityInstance();
	const releaseArtistNames = release.artistCredit.names // all release artists
		.flatMap((name) => [name.name, name.artist.name]) // entity name & credited name (possible redundancy doesn't matter)
		.map(simplifyName);

	/** @type {import('weight-balanced-tree').ImmutableTree<RecordingT> | null} */
	const selectedRecordings = MB.relationshipEditor.state.selectedRecordings;

	let addedRelCount = 0;
	let skippedDialogs = false;

	for (const copyrightItem of copyrightInfo) {
		// detect artists who own the copyright of their own release
		const targetType = options.forceArtist || releaseArtistNames.includes(simplifyName(copyrightItem.name)) ? 'artist' : 'label';

		/**
		 * There are multiple ways to fill the relationship's target entity:
		 * (1) Directly map the name to an MBID (if the name is already cached).
		 * (2) Just fill in the name and let the user select an entity (in manual mode or when the cache is bypassed).
		 */
		const targetMBID = !options.bypassCache && await nameToMBIDCache.get(targetType, copyrightItem.name); // (1a)
		let targetEntity = targetMBID
			? await entityCache.get(targetMBID) // (1b)
			: copyrightItem.name; // (2a)

		for (const type of copyrightItem.types) {
			// add all copyright rels to the release
			try {
				const linkTypeId = getLinkTypeId(targetType, 'release', type);
				let years = preferArray(copyrightItem.year);

				// do not use all years if there are multiple unspecific ones (unless enabled)
				if (years.length !== 1 && !options.useAllYears) {
					years = [undefined]; // prefer a single undated relationship
				}

				for (const year of years) {
					if (typeof targetEntity === 'string') { // (2b)
						await createDialog({
							target: targetEntity,
							targetType: targetType,
							linkTypeId,
						});
						targetEntity = await fillAndProcessDialog({ ...copyrightItem, year });
					} else { // (1c)
						createRelationship({
							target: targetEntity,
							linkTypeID: linkTypeId,
							entity0_credit: copyrightItem.name,
							...(year ? createDatePeriodForYear(year) : {}),
						});
						addedRelCount++;
					}
				}
			} catch (error) {
				console.warn(`Skipping copyright item for '${copyrightItem.name}':`, error.message);
				skippedDialogs = true;
			}

			// also add phonographic copyright rels to all selected recordings
			if (type === '℗' && selectedRecordings) {
				try {
					const linkTypeId = getLinkTypeId(targetType, 'recording', type);
					if (typeof targetEntity === 'string') {
						await createBatchDialog(selectedRecordings, {
							target: targetEntity,
							linkTypeId,
						});
						targetEntity = await fillAndProcessDialog(copyrightItem);
					} else {
						// do not fill the date if there are multiple unspecific years
						let datePeriod = {};
						if (copyrightItem.year && !Array.isArray(copyrightItem.year)) {
							datePeriod = createDatePeriodForYear(copyrightItem.year);
						}

						batchCreateRelationships(selectedRecordings, targetEntity, {
							linkTypeID: linkTypeId,
							entity0_credit: copyrightItem.name,
							...datePeriod,
						});
						addedRelCount += selectedRecordings.size;
					}
				} catch (error) {
					console.warn(`Skipping copyright item for '${copyrightItem.name}':`, error.message);
					skippedDialogs = true;
				}
			}
		}
	}

	return addedRelCount > 0 ? (skippedDialogs ? 'partial' : 'done') : 'skipped';

	/**
	 * @param {CopyrightItem} copyrightItem
	 */
	async function fillAndProcessDialog(copyrightItem) {
		creditTargetAs(copyrightItem.name);

		// do not fill the date if there are multiple unspecific years
		if (copyrightItem.year && !Array.isArray(copyrightItem.year)) {
			setYear(copyrightItem.year);
		}

		// remember the entity which the user has chosen for the given name
		const finalState = await closingDialog();

		if (finalState.closeEventType === 'accept') {
			const targetEntity = finalState.targetEntity.target;
			const creditedName = finalState.targetEntity.creditedAs;
			nameToMBIDCache.set([targetEntity.entityType, creditedName || targetEntity.name], targetEntity.gid);
			addedRelCount++;
			return targetEntity;
		} else {
			skippedDialogs = true;
			return copyrightItem.name; // keep name as target entity
		}
	}
}
