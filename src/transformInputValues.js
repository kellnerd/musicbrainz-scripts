/**
 * Transforms the values of the selected input fields using the given substitution rules.
 * Highlights all updated input fields in order to allow the user to review the changes.
 * @param {string} inputSelector CSS selector of the input fields.
 * @param {(string|RegExp)[][]} substitutionRules Pairs of values for search & replace.
 */
export function transformInputValues(inputSelector, substitutionRules) {
	const highlightProperty = 'background-color';
	$(inputSelector)
		.css(highlightProperty, '') // disable possible previously highlighted changes
		.each((_index, input) => {
			let value = input.value;
			if (!value) {
				return; // skip empty inputs
			}
			substitutionRules.forEach(([searchValue, newValue]) => {
				value = value.replace(searchValue, newValue);
				console.debug(value);
			});
			if (value != input.value) { // update and highlight changed values
				$(input).val(value)
					.trigger('change')
					.css(highlightProperty, 'yellow');
			}
		});
}
