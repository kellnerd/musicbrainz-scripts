
/**
 * Simplifies the given name to ease matching of strings.
 * @param {string} name 
 */
export function simplifyName(name) {
	return name.normalize('NFKD') // Unicode NFKD compatibility decomposition
		.replace(/[^\p{L}\d]/ug, '') // keep only letters and numbers, remove e.g. combining diacritical marks of decompositions
		.toLowerCase();
}
