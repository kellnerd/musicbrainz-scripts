
/** Pattern to match an ES RegExp string representation. */
export const regexPattern = /^\/(.+?)\/([gimsuy]*)$/;

/**
 * Escapes special characters in the given string to use it as part of a regular expression.
 * @param {string} string 
 * @link https://stackoverflow.com/a/6969486
 */
export function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Returns the value of the given pattern input as a regular expression if it is enclosed between slashes.
 * Otherwise it returns the raw input as a string or throws for invalid regular expressions.
 * @param {HTMLInputElement} input 
 * @returns {RegExp|string}
 */
export function getPattern(input) {
	const value = input.value;
	const match = value.match(regexPattern);

	if (match) {
		return new RegExp(match[1], match[2]);
	} else {
		return value;
	}
}

/**
 * Converts the value of the given pattern input into a regular expression and returns it.
 * @param {HTMLInputElement} input 
 */
export function getPatternAsRegExp(input) {
	try {
		const value = getPattern(input);
		if (typeof value === 'string') {
			value = new RegExp(escapeRegExp(value));
		}
		return value;
	} catch {
		return;
	}
}
