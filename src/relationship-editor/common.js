
/** @returns {DatePeriodRoleT} */
export function createDatePeriodForYear(year) {
	return {
		begin_date: { year },
		end_date: { year },
		ended,
	};
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
	_status: REL_STATUS_ADD,
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

const REL_STATUS_ADD = 1;
