
/**
 * Checks whether the given objects have the same values for the given properties.
 * @param {object} subject 
 * @param {object} target 
 * @param  {...keyof typeof target} properties 
 */
export function hasEqualProperties(subject, target, ...properties) {
	return properties.every((property) => subject[property] === target[property]);
}

/**
 * Checks whether the given objects are strictly equal or have the same values for all nested properties.
 * @returns {boolean}
 */
export function deepEquals(a, b) {
	if (a === b) return true;

	// if one of A and B is not an object/array, and they were not strictly equal, they can not be equal
	if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

	const properties = Object.getOwnPropertyNames(a);

	// if A is an empty object, B also has to be an empty object
	if (!properties.length) {
		return Object.getOwnPropertyNames(b).length === 0;
	}

	return properties.every((property) => deepEquals(a[property], b[property]));
}
