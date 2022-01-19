
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
