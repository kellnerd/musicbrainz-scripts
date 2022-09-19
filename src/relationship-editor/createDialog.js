import { isRelBackward } from './common.js';
import { waitFor } from '../../utils/async/polling.js';

/**
 * Creates a dialog to add a relationship to the given source entity.
 * @param {Object} options 
 * @param {CoreEntityT} [options.source] Source entity, defaults to the currently edited entity.
 * @param {CoreEntityT | string} [options.target] Target entity object or name.
 * @param {CoreEntityTypeT} [options.targetType] Target entity type, fallback if there is no full entity given.
 * @param {number} [options.linkTypeId]
 */
export async function createDialog({
	source = MB.relationshipEditor.state.entity,
	target,
	targetType,
	linkTypeId,
} = {}) {
	// prefer an explicit target entity option over only a target type
	if (target && typeof target !== 'string') {
		targetType = target.entityType;
	}

	// open dialog modal for the source entity
	MB.relationshipEditor.dispatch({
		type: 'update-dialog-location',
		location: {
			source,
			// TODO: Why do the options below have no effect?
			// targetType,
			// linkTypeId,
			// backward: isRelBackward(source.entityType, targetType),
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
		const availableLinkTypes = MB.relationshipEditor.relationshipDialogState.linkType.autocomplete.items;
		const linkTypeItem = availableLinkTypes.find((item) => (item.id == linkTypeId));

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
	const autocompleteActions = (typeof target === 'string') ? [{
		type: 'type-value',
		value: target,
	}, {
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

	// TODO: accept/close dialog or attach callback to get selected target entity
	const selectedTargetEntity = MB.relationshipEditor.relationshipDialogState.targetEntity.target;
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
 */
