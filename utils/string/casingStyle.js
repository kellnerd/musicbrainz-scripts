
/**
 * Converts the name from camel case into title case.
 * @param {string} name
 */
export function camelToTitleCase(name) {
	return splitCamelCase(upperCaseFirstLetter(name))
		.join(' ');
}

/**
 * Converts a string into an identifier that is compatible with Markdown's heading anchors.
 * @param {string} string
 */
export function slugify(string) {
	return encodeURIComponent(
		string.trim()
			.toLowerCase()
			.replace(/\s+/g, '-')
	);
}

/** @param {string} string */
function splitCamelCase(string) {
	return string
		.split(/(?<=[\p{Ll}\d])(?=\p{Lu})|(?<=\p{L})(?=\d)|(?<=\p{Lu}+)(?=\p{Lu}\p{Ll}+)/u);
	// 1. after a lower case letter or digit which is followed by an upper case letter
	// 2. after a letter which is followed by a digit
	// 3. after multiple upper case letters which are followed by a new word (starts with the last of these upper case letters)
}

/** @param {string} word */
function upperCaseFirstLetter(word) {
	return word.replace(/^./, c => c.toUpperCase());
}
