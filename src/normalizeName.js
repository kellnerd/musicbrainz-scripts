
/**
 * Normalizes the given name to ease matching of names.
 * @param {string} name 
 */
export function normalizeName(name) {
	return name.normalize('NFKD') // Unicode NFKD compatibility decomposition
		.replace(/[^\p{L}\d]/ug, '') // keep only letters and numbers, remove combining diacritical marks of decompositions
		.toLowerCase();
}
