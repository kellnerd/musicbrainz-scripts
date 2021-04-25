/**
 * Flattens the given object.
 * @param {Object} object 
 * @returns {Object}
 */
export function flatten(object) {
	let flatObject = {};
	for (let key in object) {
		let value = object[key];
		if (typeof value === 'object') { // also matches arrays
			value = flatten(value);
			for (let childKey in value) {
				flatObject[key + '.' + childKey] = value[childKey]; // concatenate keys
			}
		} else { // value is already flat, e.g. a string
			flatObject[key] = value; // keep the key
		}
	}
	return flatObject;
}
