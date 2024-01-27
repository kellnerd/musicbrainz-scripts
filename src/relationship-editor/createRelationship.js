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
 * Updates the given relationship with new properties.
 * @param {CoreEntityT} sourceEntity The source entity from which the relationship originates.
 * @param {RelationshipT} rel The existing relationship.
 * @param {RelationshipProps} props Relationship properties which should be changed.
 */
export function updateRelationship(sourceEntity, rel, props) {
	const relState = createRelationshipState(sourceEntity, rel);
	MB.relationshipEditor.dispatch({
		type: 'update-relationship-state',
		sourceEntity,
		creditsToChangeForSource: '',
		creditsToChangeForTarget: '',
		newRelationshipState: {
			...relState,
			_status: 2, // edit relationship
			_original: relState,
			...props,
		},
		oldRelationshipState: relState,
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
 * Converts relationship properties into a relationship state which can be used to update relationships.
 * @param {CoreEntityT} sourceEntity The source entity from which the relationship originates.
 * @param {RelationshipT} rel The relationship properties.
 * @returns {import('../types/MBS/scripts/relationship-editor/state.js').RelationshipStateT}
 */
function createRelationshipState(sourceEntity, rel) {
	return {
		id: rel.id,
		entity0: rel.backward ? rel.target : sourceEntity,
		entity1: rel.backward ? sourceEntity : rel.target,
		attributes: MB.tree.fromDistinctAscArray(rel.attributes),
		begin_date: rel.begin_date,
		end_date: rel.end_date,
		ended: rel.ended,
		entity0_credit: rel.entity0_credit,
		entity1_credit: rel.entity1_credit,
		linkOrder: rel.linkOrder,
		linkTypeID: rel.linkTypeID,
		editsPending: rel.editsPending,
		_lineage: [],
		_original: null,
		_status: 0, // noop
	}
}

/**
 * @typedef {import('weight-balanced-tree').ImmutableTree<LinkAttrT>} LinkAttrTree
 * @typedef {Partial<Omit<RelationshipT, 'attributes'> & { attributes: LinkAttrTree }>} RelationshipProps
 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').ExternalLinkAttrT} ExternalLinkAttrT
 */
