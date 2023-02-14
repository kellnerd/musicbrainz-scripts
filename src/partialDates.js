
/**
 * @param {Date} date 
 * @returns {PartialDateT}
 */
export function toPartialDate(date) {
	return {
		day: date.getUTCDate(),
		month: date.getUTCMonth() + 1,
		year: date.getUTCFullYear(),
	};
}
