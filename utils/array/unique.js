import { deepEquals } from '../object/compare.js';

/**
 * Returns the unique elements of the given array (deep comparison).
 * @template T
 * @param {T[]} array 
 */
export function getUniqueElements(array) {
	return array.filter((element, index) => {
		return index === array.findIndex((foundElement) => deepEquals(element, foundElement));
	});
}

/**
 * Returns the unique elements of the given array (JSON comparison).
 * @template T
 * @param {T[]} array 
 */
export function getUniqueElementsByJSON(array) {
	// use a Map to keep the order of elements, the JSON representation is good enough as a unique key for our use
	return Array.from(new Map(
		array.map((element) => [JSON.stringify(element), element])
	).values());
}
