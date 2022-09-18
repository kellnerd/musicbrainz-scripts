
/**
 * @param {CoreEntityTypeT} sourceType 
 * @param {CoreEntityTypeT} targetType 
 */
export function isRelBackward(sourceType, targetType) {
	return sourceType > targetType;
}
