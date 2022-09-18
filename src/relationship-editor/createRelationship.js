import {
	isRelBackward,
	RELATIONSHIP_DEFAULTS,
} from './common.js';

/**
 * Creates a relationship between the given source and target entity.
 * @param {Object} options 
 * @param {CoreEntityT} [options.source] Source entity, defaults to the currently edited entity.
 * @param {CoreEntityT} options.target Target entity.
 * @param {number} [options.linkTypeId]
 */
export function createRelationship({
	source = MB.relationshipEditor.state.entity,
	target,
	linkTypeId,
	// TODO: support credited names and relationship attributes
}) {
	const backward = isRelBackward(source.entityType, target.entityType);

	MB.relationshipEditor.dispatch({
		type: 'update-relationship-state',
		sourceEntity: source,
		creditsToChangeForSource: '',
		creditsToChangeForTarget: '',
		newRelationshipState: {
			...RELATIONSHIP_DEFAULTS,
			entity0: backward ? target : source,
			entity1: backward ? source : target,
			linkTypeID: linkTypeId,
			id: -1701, // TODO: use a unique negative number as returned by `getRelationshipStateId(null)`
		},
		oldRelationshipState: null,
	});
}
