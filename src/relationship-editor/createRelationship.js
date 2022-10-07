import {
	isRelBackward,
	RELATIONSHIP_DEFAULTS,
} from './common.js';

/**
 * Creates a relationship between the given source and target entity.
 * @param {Partial<RelationshipT> & { source?: CoreEntityT, target: CoreEntityT }} options 
 * @param {CoreEntityT} [options.source] Source entity, defaults to the currently edited entity.
 * @param {CoreEntityT} options.target Target entity.
 * @param {Partial<RelationshipT>} props Relationship properties.
 */
export function createRelationship({
	source = MB.relationshipEditor.state.entity,
	target,
	...props
}) {
	const backward = isRelBackward(source.entityType, target.entityType);

	console.info('Creating relationship');
	MB.relationshipEditor.dispatch({
		type: 'update-relationship-state',
		sourceEntity: source,
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
