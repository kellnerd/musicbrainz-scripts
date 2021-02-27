/**
 * Changes the date for all release events of a release to the given values.
 * The corresponding input fields of undefined parameters will be cleared.
 */
export function changeAllReleaseDates(year, month, day) {
	updateAllPartialDateInputs('year', year);
	updateAllPartialDateInputs('month', month);
	updateAllPartialDateInputs('day', day);
}


function updateAllPartialDateInputs(part, value) {
	// setting `undefined` as value will clear the input fields as desired
	$('input.partial-date-' + part).val(value)
		.trigger('change');
}
