
/**
 * Transforms the given value using the given substitution rules.
 * @param {string} value
 * @param {SubstitutionRule[]} substitutionRules Pairs of values for search & replace.
 * @returns {string}
 */
export function transform(value, substitutionRules) {
	substitutionRules.forEach(([searchValue, replaceValue]) => {
		value = value.replace(searchValue, replaceValue);
	});
	return value;
}
