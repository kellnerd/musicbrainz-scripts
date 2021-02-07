/**
 * Renames all tracks using their absolute track number and a customizable prefix.
 * Useful to number the parts of an audiobook without chapters and other releases with untitled tracks.
 * Asks the user to input a numbering prefix which can optionally be preceded by flags:
 * - Append the number (including the given prefix) to the current titles: `+`
 * - Pad numbers with leading zeros to the same length: `_`
 * - *Example*: `+_, Part ` renames track 27/143 "Title" to "Title, Part 027"
 */
function enumerateTrackTitles() {
	let $trackTitles = $('input.track-name');
	let userInput = prompt('Numbering prefix, preceded by flags:\n+ append to current titles\n_ pad numbers', 'Part ');

	/* parse user input to extract flags and the number prefix */
	let [, flags, prefix] = userInput.match(/^([+_]*)(.+)/);
	let isPadNumbersEnabled = flags.includes('_');
	let isAppendEnabled = flags.includes('+');

	/* setup padding of numbers to the same length */
	const maxTrackDigits = $trackTitles.length.toString().length;
	const numberFormat = new Intl.NumberFormat('en', { minimumIntegerDigits: maxTrackDigits });

	$trackTitles.each((index, input) => {
		let trackNumber = index + 1;
		if (isPadNumbersEnabled) trackNumber = numberFormat.format(trackNumber);
		let newTitle = prefix + trackNumber;
		if (isAppendEnabled) {
			// append the "prefix" and the track number to the old title as a suffix
			newTitle = (input.value + newTitle)
				// ... if it already ended with an alternative punctuation mark, remove any following comma from the "prefix"
				.replace(/([.!?]),/, '$1');
		}
		console.debug(newTitle);
		$(input).val(newTitle);
	});
}
