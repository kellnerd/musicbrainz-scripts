
/** @returns {DatePeriodRoleT} */
export function createDatePeriodForYear(year) {
	return {
		begin_date: { year },
		end_date: { year },
		ended,
	};
}

// TODO: drop once the new React relationship editor has been deployed, together with the other fallbacks for the old one
export function hasReactRelEditor() {
	return !!MB.getSourceEntityInstance;
}

/**
 * @param {CoreEntityTypeT} sourceType 
 * @param {CoreEntityTypeT} targetType 
 */
export function isRelBackward(sourceType, targetType) {
	return sourceType > targetType;
}

// Taken from root/static/scripts/relationship-editor/hooks/useRelationshipDialogContent.js
export const RELATIONSHIP_DEFAULTS = {
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
