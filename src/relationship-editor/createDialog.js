import { retry, waitFor } from '../../utils/async/polling.js';
import { qs } from '../../utils/dom/select.js';

/**
 * Creates a dialog to add a relationship to the given source entity.
 * @param {Object} options 
 * @param {CoreEntityT} [options.source] Source entity, defaults to the currently edited entity.
 * @param {CoreEntityT | string} [options.target] Target entity object or name.
 * @param {CoreEntityTypeT} [options.targetType] Target entity type, fallback if there is no full entity given.
 * @param {number} [options.linkTypeId]
 * @param {boolean} [options.batchSelection] Batch-edit all selected entities which have the same type as the source.
 * The source entity only acts as a placeholder in this case.
 */
export async function createDialog({
	source = MB.relationshipEditor.state.entity,
	target,
	targetType,
	linkTypeId,
	batchSelection = false,
} = {}) {
	const onlyTargetName = (typeof target === 'string');

	// prefer an explicit target entity option over only a target type
	if (target && !onlyTargetName) {
		targetType = target.entityType;
	}

	// open dialog modal for the source entity
	MB.relationshipEditor.dispatch({
		type: 'update-dialog-location',
		location: {
			source,
			batchSelection,
		},
	});

	// TODO: currently it takes ~2ms until `relationshipDialogDispatch` is exposed
	await waitFor(() => !!MB.relationshipEditor.relationshipDialogDispatch, 1);

	if (targetType) {
		MB.relationshipEditor.relationshipDialogDispatch({
			type: 'update-target-type',
			source,
			targetType,
		});
	}

	if (linkTypeId) {
		const linkTypeItem = await retry(() => {
			// the available items are only valid for the current target type,
			// ensure that they have already been updated after a target type change
			const availableLinkTypes = MB.relationshipEditor.relationshipDialogState.linkType.autocomplete.items;
			return availableLinkTypes.find((item) => (item.id == linkTypeId));
		}, { wait: 10 });

		if (linkTypeItem) {
			MB.relationshipEditor.relationshipDialogDispatch({
				type: 'update-link-type',
				source,
				action: {
					type: 'update-autocomplete',
					source,
					action: {
						type: 'select-item',
						item: linkTypeItem,
					},
				},
			});
		}
	}

	if (!target) return;

	/** @type {AutocompleteActionT[]} */
	const autocompleteActions = onlyTargetName ? [{
		type: 'type-value',
		value: target,
	}, { // search does not block future actions
		type: 'search-after-timeout',
		searchTerm: target,
	}] : [{
		type: 'select-item',
		item: entityToSelectItem(target),
	}];

	// autofill the target entity as good as possible
	autocompleteActions.forEach((autocompleteAction) => {
		MB.relationshipEditor.relationshipDialogDispatch({
			type: 'update-target-entity',
			source,
			action: {
				type: 'update-autocomplete',
				source,
				action: autocompleteAction,
			},
		});
	});

	// focus target entity input if it could not be auto-selected
	if (onlyTargetName) {
		qs('input.relationship-target').focus();
	}
}

/**
 * Creates a dialog to batch-add a relationship to the selected entities of the given source type.
 * @param {'recordings' | 'works'} sourceType
 * @param {Omit<Parameters<typeof createDialog>[0], 'batchSelection' | 'source'>} options
 */
export function createBatchDialog(sourceType, {
	target,
	targetType,
	linkTypeId,
} = {}) {
	/** @type {ReleaseRelationshipEditorStateT} */
	const releaseState = MB.relationshipEditor.state;
	const sourceTree = (sourceType === 'work') ? releaseState.selectedWorks : releaseState.selectedRecordings;

	return createDialog({
		source: sourceTree.value, // use the root node entity as a placeholder
		target,
		targetType,
		linkTypeId,
		batchSelection: true,
	});
}

/** @param {string} searchTerm */
export function triggerSearch(searchTerm) {
	MB.relationshipEditor.relationshipDialogDispatch({
		type: 'update-target-entity',
		source: MB.relationshipEditor.state.dialogLocation.source,
		action: {
			type: 'update-autocomplete',
			source,
			action: {
				type: 'search-after-timeout',
				searchTerm,
			},
		},
	});
}

/**
 * Resolves after the current/next relationship dialog has been closed.
 * @returns {Promise<RelationshipDialogFinalStateT>} The final state of the dialog when it was closed by the user.
 */
export async function closingDialog() {
	return new Promise((resolve) => {
		// wait for the user to accept or cancel the dialog
		document.addEventListener('mb-close-relationship-dialog', (event) => {
			const finalState = event.dialogState;
			finalState.closeEventType = event.closeEventType;
			resolve(finalState);
		}, { once: true });
	});
}

/** @param {string} creditedAs Credited name of the target entity. */
export function creditTargetAs(creditedAs) {
	MB.relationshipEditor.relationshipDialogDispatch({
		type: 'update-target-entity',
		source: MB.relationshipEditor.state.dialogLocation.source,
		action: {
			type: 'update-credit',
			action: {
				type: 'set-credit',
				creditedAs,
			},
		},
	});
}

/**
 * Sets the begin or end date of the current dialog.
 * @param {PartialDateT} date
 */
export function setDate(date, isBegin = true) {
	MB.relationshipEditor.relationshipDialogDispatch({
		type: 'update-date-period',
		action: {
			type: isBegin ? 'update-begin-date' : 'update-end-date',
			action: {
				type: 'set-date',
				date: date,
			},
		},
	});
}

/** @param {DatePeriodRoleT} datePeriod */
export function setDatePeriod(datePeriod) {
	setDate(datePeriod.begin_date, true);
	setDate(datePeriod.end_date, false);

	MB.relationshipEditor.relationshipDialogDispatch({
		type: 'update-date-period',
		action: {
			type: 'set-ended',
			enabled: datePeriod.ended,
		},
	});
}

/** @param {number} year */
export function setYear(year) {
	setDatePeriod({
		begin_date: { year },
		end_date: { year },
		ended: true,
	});
}

// WIP
export function addVocalAttribute(id, creditedAs) {
	MB.relationshipEditor.relationshipDialogDispatch({
		type: 'update-attribute',
		action: {
			type: 'update-multiselect-attribute',
			// rootKey,
			action: {
				type: 'update-value-autocomplete',
				// valueKey,
				action: {
					type: 'select-item',
					item: {
						id,
					},
				},
			},
		},
	});

	if (creditedAs) {
		MB.relationshipEditor.relationshipDialogDispatch({
			type: 'update-attribute',
			action: {
				type: 'update-multiselect-attribute',
				// rootKey,
				action: {
					type: 'set-value-credit',
					// valueKey,
					creditedAs,
				},
			},
		});
	}
}

/**
 * @param {EntityItemT} entity 
 * @returns {OptionItemT}
 */
function entityToSelectItem(entity) {
	return {
		type: 'option',
		id: entity.id,
		name: entity.name,
		entity,
	};
}

/**
 * @typedef {import('../types/MBS/scripts/autocomplete2.js').EntityItemT}  EntityItemT
 * @typedef {import('../types/MBS/scripts/autocomplete2.js').OptionItemT<EntityItemT>} OptionItemT
 * @typedef {import('../types/MBS/scripts/autocomplete2.js').ActionT<EntityItemT>} AutocompleteActionT
 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').ReleaseRelationshipEditorStateT} ReleaseRelationshipEditorStateT
 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').RelationshipDialogStateT & {closeEventType: 'accept' | 'cancel'}} RelationshipDialogFinalStateT
 */
