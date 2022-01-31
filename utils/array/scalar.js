
/**
 * Converts an array with a single element into a scalar.
 * @template T
 * @param {MaybeArray<T>} maybeArray 
 * @returns A scalar or `undefined` if the conversion is not possible.
 */
export function toScalar(maybeArray) {
	if (Array.isArray(maybeArray)) {
		if (maybeArray.length === 1) return maybeArray[0];
	} else {
		return maybeArray;
	}
}

/**
 * Converts an array with a single element into a scalar.
 * @template T
 * @param {MaybeArray<T>} maybeArray 
 * @returns A scalar or the input array if the conversion is not possible.
 */
export function preferScalar(maybeArray) {
	if (Array.isArray(maybeArray) && maybeArray.length === 1) return maybeArray[0];
	return maybeArray;
}

/**
 * Converts a scalar into an array with a single element.
 * @template T
 * @param {MaybeArray<T>} maybeArray 
 */
export function preferArray(maybeArray) {
	if (!Array.isArray(maybeArray)) return [maybeArray];
	return maybeArray;
}
