
/**
 * MBS relationship link type IDs (incomplete).
 * @type {Record<CoreEntityTypeT, Record<CoreEntityTypeT, Record<string, number>>>}
 */
export const LINK_TYPES = {
	release: {
		artist: {
			'©': 709,
			'℗': 710,
		},
		label: {
			'©': 708,
			'℗': 711,
			'licensed from': 712,
			'licensed to': 833,
			'distributed by': 361,
			'manufactured by': 360,
			'marketed by': 848,
		},
	},
	recording: {
		artist: {
			'℗': 869,
		},
		label: {
			'℗': 867,
		},
	},
};

/**
 * Returns the internal ID of the requested relationship link type.
 * @param {CoreEntityTypeT} sourceType Type of the source entity.
 * @param {CoreEntityTypeT} targetType Type of the target entity.
 * @param {string} relType 
 */
export function getLinkTypeId(sourceType, targetType, relType) {
	const linkTypeId = LINK_TYPES[targetType]?.[sourceType]?.[relType];

	if (linkTypeId) {
		return linkTypeId;
	} else {
		throw new Error(`Unsupported ${sourceType}-${targetType} relationship type '${relType}'`);
	}
}
