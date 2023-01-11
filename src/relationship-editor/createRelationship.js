import {
	isRelBackward,
	RELATIONSHIP_DEFAULTS,
} from './common.js';

/**
 * Creates a relationship between the given source and target entity.
 * @param {RelationshipProps & { source?: CoreEntityT, target: CoreEntityT, batchSelectionCount?: number }} options
 * @param {CoreEntityT} [options.source] Source entity, defaults to the currently edited entity.
 * @param {CoreEntityT} options.target Target entity.
 * @param {number} [options.batchSelectionCount] Batch-edit all selected entities which have the same type as the source.
 * The source entity only acts as a placeholder in this case.
 * @param {RelationshipProps} props Relationship properties.
 */
export function createRelationship({
	source = MB.relationshipEditor.state.entity,
	target,
	batchSelectionCount = null,
	...props
}) {
	const backward = isRelBackward(source.entityType, target.entityType);

	MB.relationshipEditor.dispatch({
		type: 'update-relationship-state',
		sourceEntity: source,
		batchSelectionCount,
		creditsToChangeForSource: '',
		creditsToChangeForTarget: '',
		newRelationshipState: {
			...RELATIONSHIP_DEFAULTS,
			entity0: backward ? target : source,
			entity1: backward ? source : target,
			id: MB.relationshipEditor.getRelationshipStateId(),
			...props,
		},
		oldRelationshipState: null,
	});
}

/**
 * Creates the same relationship between each of the selected source entities and the given target entity.
 * @param {import('weight-balanced-tree').ImmutableTree<CoreEntityT>} sourceSelection Selected source entities.
 * @param {CoreEntityT} target Target entity.
 * @param {RelationshipProps} props Relationship properties.
 */
export function batchCreateRelationships(sourceSelection, target, props) {
	return createRelationship({
		source: sourceSelection.value, // use the root node entity as a placeholder
		target,
		batchSelectionCount: sourceSelection.size,
		...props,
	});
}

/**
 * Converts the given relationship attribute(s) into a tree which contains their full attribute type properties.
 * @param {ExternalLinkAttrT[]} attributes Distinct attributes, ordered by type ID.
 * @returns {LinkAttrTree}
 */
export function createAttributeTree(...attributes) {
	return MB.tree.fromDistinctAscArray(attributes
		.map((attribute) => {
			const attributeType = MB.linkedEntities.link_attribute_type[attribute.type.gid];
			return {
				...attribute,
				type: attributeType,
				typeID: attributeType.id,
			};
		})
	);
}

/**
 * @typedef {import('weight-balanced-tree').ImmutableTree<LinkAttrT>} LinkAttrTree
 * @typedef {Partial<Omit<RelationshipT, 'attributes'> & { attributes: LinkAttrTree }>} RelationshipProps
 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').ExternalLinkAttrT} ExternalLinkAttrT
 */
