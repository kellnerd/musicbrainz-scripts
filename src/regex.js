
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
 * Returns the value of the given pattern as a regular expression if it is enclosed between slashes.
 * Otherwise it returns the input string or throws for invalid regular expressions.
 * @param {string} pattern 
 * @returns {RegExp|string}
 */
export function getPattern(pattern) {
	const match = pattern.match(regexPattern);
	if (match) {
		return new RegExp(match[1], match[2]);
	} else {
		return pattern;
	}
}

/**
 * Converts the value of the given pattern into a regular expression and returns it.
 * @param {string} pattern 
 */
export function getPatternAsRegExp(pattern) {
	try {
		let value = getPattern(pattern);
		if (typeof value === 'string') {
			value = new RegExp(escapeRegExp(value));
		}
		return value;
	} catch {
		return;
	}
}
