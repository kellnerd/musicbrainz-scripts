
/**
 * Creates a custom `URLSearchParams` object where each array is serialized into multiple parameters with the same name
 * instead of a single parameter with concatenated values (e.g. `{ a: [1, 2] }` becomes `a=1&a=2` instead of `a=1,2`).
 * @param {Object} params Dictionary of parameters.
 */
export function urlSearchMultiParams(params) {
	const searchParams = new URLSearchParams();
	for (const name in params) {
		const value = params[name];
		if (Array.isArray(value)) {
			value.forEach((value) => searchParams.append(name, value));
		} else {
			searchParams.append(name, value);
		}
	}
	return searchParams;
}
