
/**
 * Converts the name from camel case into title case.
 * @param {string} name
 */
export function camelToTitleCase(name) {
	return name
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/^./, c => c.toUpperCase());
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
