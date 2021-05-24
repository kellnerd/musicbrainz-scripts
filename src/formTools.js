/**
 * Flattens the given (deep) object to a single level hierarchy.
 * Concatenates the keys in a nested structure which lead to a value with dots.
 * @param {Object} object 
 * @param {string[]} preservedKeys Keys whose values will be preserved.
 * @returns {Object}
 */
export function flatten(object, preservedKeys = []) {
	let flatObject = {};
	for (let key in object) {
		let value = object[key];
		if (typeof value === 'object' && value !== null && !preservedKeys.includes(key)) { // also matches arrays
			value = flatten(value, preservedKeys);
			for (let childKey in value) {
				flatObject[key + '.' + childKey] = value[childKey]; // concatenate keys
			}
		} else { // value is already flat (e.g. a string) or should be preserved
			flatObject[key] = value; // keep the key
		}
	}
	return flatObject;
}

/**
 * Creates a custom `URLSearchParams` object where each array is serialized into multiple parameters with the same name
 * instead of a single parameter with concatenated values (e.g. `{ a: [1, 2] }` becomes `a=1&a=2` instead of `a=1,2`).
 * @param {Object} params Dictionary of parameters.
 * @returns {URLSearchParams}
 */
export function urlSearchMultiParams(params) {
	const searchParams = new URLSearchParams();
	for (let name in params) {
		const value = params[name];
		if (Array.isArray(value)) {
			value.forEach((value) => searchParams.append(name, value));
		} else {
			searchParams.append(name, value);
		}
	}
	return searchParams;
}
