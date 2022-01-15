
/**
 * Converts an array with a single element into a scalar.
 * @template T
 * @param {T|T[]} maybeArray 
 */
export function preferScalar(maybeArray) {
	if (Array.isArray(maybeArray) && maybeArray.length === 1) return maybeArray[0];
	return maybeArray;
}
