
/**
 * Transforms the given value using the given substitution rules.
 * @param {string} value
 * @param {(string|RegExp)[][]} substitutionRules Pairs of values for search & replace.
 * @returns {string}
 */
export function transform(value, substitutionRules) {
	substitutionRules.forEach(([searchValue, replaceValue]) => {
		value = value.replace(searchValue, replaceValue);
	});
	return value;
}
