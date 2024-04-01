
/** @returns {DatePeriodRoleT} */
export function createDatePeriodForYear(year) {
	return {
		begin_date: { year },
		end_date: { year },
		ended: true,
	};
}

/**
 * @param {CoreEntityTypeT} sourceType 
 * @param {CoreEntityTypeT} targetType 
 */
export function isRelBackward(sourceType, targetType, changeDirection = false) {
	if (sourceType === targetType) return changeDirection;
	return sourceType > targetType;
}

/**
 * Taken from https://github.com/metabrainz/musicbrainz-server/blob/bf0d5ec41c7ddb6c5a8396bf3a64f74acaef9337/root/static/scripts/relationship-editor/hooks/useRelationshipDialogContent.js
 * @type {Partial<import('../types/MBS/scripts/relationship-editor/state').RelationshipStateT>}
 */
export const RELATIONSHIP_DEFAULTS = {
	_lineage: [],
	_original: null,
	_status: 1, // add relationship
	attributes: null,
	begin_date: null,
	editsPending: false,
	end_date: null,
	ended: false,
	entity0_credit: '',
	entity1_credit: '',
	id: null,
	linkOrder: 0,
	linkTypeID: null,
};
