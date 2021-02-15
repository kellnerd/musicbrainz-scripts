/**
 * Changes the date for all release events of a release according to the user's input.
 * Useful to correct the dates for digital media releases (with lots of release events) which are using the wrong first
 * release date of the release group.
 */
function changeAllReleaseDates() {
	const input = prompt('Date for all release events (YYYY-MM-DD):');
	const [date, year, month, day] = /(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(input)
		|| []; // input does not match a date, set all values to `undefined`

	/* missing parts of the date are `undefined`, setting `undefined` as value will clear the input fields as desired */
	updateAllPartialDateInputs('year', year);
	updateAllPartialDateInputs('month', month);
	updateAllPartialDateInputs('day', day);
}

function updateAllPartialDateInputs(part, value) {
	$('input.partial-date-' + part).val(value)
		.trigger('change');
}
