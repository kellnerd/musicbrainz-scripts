import { waitFor } from '@kellnerd/es-utils/async/polling.js';
import { qs } from '@kellnerd/es-utils/dom/select.js';

/**
 * Creates a dialog to add a relationship to the given source entity.
 * @param {Object} options 
 * @param {CoreEntityT} [options.source] Source entity, defaults to the currently edited entity.
 * @param {CoreEntityT | string} [options.target] Target entity object or name.
 * @param {CoreEntityTypeT} [options.targetType] Target entity type, fallback if there is no full entity given.
 * @param {number} [options.linkTypeId] Internal ID of the relationship type.
 * @param {ExternalLinkAttrT[]} [options.attributes] Attributes for the relationship type.
 * @param {boolean} [options.batchSelection] Batch-edit all selected entities which have the same type as the source.
 * The source entity only acts as a placeholder in this case.
 */
export async function createDialog({
	source = MB.relationshipEditor.state.entity,
	target,
	targetType,
	linkTypeId,
	attributes,
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
		const linkType = MB.linkedEntities.link_type[linkTypeId];

		if (linkType) {
			MB.relationshipEditor.relationshipDialogDispatch({
				type: 'update-link-type',
				source,
				action: {
					type: 'update-autocomplete',
					source,
					action: {
						type: 'select-item',
						item: entityToSelectItem(linkType),
					},
				},
			});
		} else {
			console.debug('Failed to find link type item for ID', linkTypeId);
		}
	}

	if (attributes) {
		setAttributes(attributes);
	}

	if (!target) return;

	/** @type {AutocompleteActionT[]} */
	const autocompleteActions = onlyTargetName ? [{
		type: 'type-value',
		value: target,
	}, { // search dropdown is unaffected by future actions which set credits or date periods
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
 * Creates a dialog to batch-add a relationship to each of the selected source entities.
 * @param {import('weight-balanced-tree').ImmutableTree<CoreEntityT>} sourceSelection Selected source entities.
 * @param {Omit<Parameters<typeof createDialog>[0], 'batchSelection' | 'source'>} options
 */
export function createBatchDialog(sourceSelection, options = {}) {
	return createDialog({
		...options,
		source: sourceSelection.value, // use the root node entity as a placeholder
		batchSelection: true,
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

/**
 * Sets the relationship attributes of the current dialog.
 * @param {ExternalLinkAttrT[]} attributes 
 */
export function setAttributes(attributes) {
	MB.relationshipEditor.relationshipDialogDispatch({
		type: 'set-attributes',
		attributes,
	});
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
 * @typedef {import('../types/MBS/scripts/autocomplete2.js').EntityItemT} EntityItemT
 * @typedef {import('../types/MBS/scripts/autocomplete2.js').OptionItemT<EntityItemT>} OptionItemT
 * @typedef {import('../types/MBS/scripts/autocomplete2.js').ActionT<EntityItemT>} AutocompleteActionT
 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').ExternalLinkAttrT} ExternalLinkAttrT
 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').RelationshipDialogStateT & { closeEventType: 'accept' | 'cancel' }} RelationshipDialogFinalStateT
 */
