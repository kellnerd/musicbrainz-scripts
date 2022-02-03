import { qsa } from './select.js';
import { transform } from '../string/transform.js';

export const defaultHighlightClass = 'content-changed';

/**
 * Transforms the values of the selected input fields using the given substitution rules.
 * Highlights all updated input fields in order to allow the user to review the changes.
 * @param {string} inputSelector CSS selector of the input fields.
 * @param {SubstitutionRule[]} substitutionRules Pairs of values for search & replace.
 * @param {Event} [event] Event which should be triggered for changed input fields (optional, defaults to 'change').
 * @param {string} [highlightClass] CSS class which should be applied to changed input fields (optional, defaults to `defaultHighlightClass`).
 */
export function transformInputValues(inputSelector, substitutionRules, event = new Event('change'), highlightClass = defaultHighlightClass) {
	qsa(inputSelector).forEach((/** @type {HTMLInputElement} */ input) => {
		input.classList.remove(highlightClass); // disable possible previously highlighted changes
		let value = input.value;
		if (!value) {
			return; // skip empty inputs
		}
		value = transform(value, substitutionRules);
		if (value != input.value) { // update and highlight changed values
			input.value = value;
			input.dispatchEvent(event);
			input.classList.add(highlightClass);
		}
	});
}

/**
 * Transforms the values of the selected input fields using the given substitution rules.
 * Highlights all updated input fields in order to allow the user to review the changes.
 * @param {string} inputSelector CSS selector of the input fields.
 * @param {SubstitutionRule[]} substitutionRules Pairs of values for search & replace.
 * @deprecated Legacy function for bookmarklets (uses inline CSS for highlighting, change event is not configurable).
 */
export function $transformInputValues(inputSelector, substitutionRules) {
	const highlightProperty = 'background-color';
	$(inputSelector)
		.css(highlightProperty, '') // disable possible previously highlighted changes
		.each((_index, input) => {
			/** @type {string} */
			let value = input.value;
			if (!value) {
				return; // skip empty inputs
			}
			value = transform(value, substitutionRules);
			if (value != input.value) { // update and highlight changed values
				$(input).val(value)
					.trigger('change')
					.css(highlightProperty, 'yellow');
			}
		});
}
