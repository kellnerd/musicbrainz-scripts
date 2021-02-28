/**
 * Renames all tracks using their absolute track number and a customizable prefix.
 * @param {string} prefix Prefix of the track number.
 * @param {Object} flags
 * @param {boolean} flags.append Append the number (including the given prefix) to the current title.
 * @param {boolean} flags.padNumbers Enable padding of numbers with leading zeros.
 */
export function enumerateTrackTitles(prefix = '', flags = {}) {
	let $trackTitles = $('input.track-name');

	/* setup padding of numbers to the same length */
	const maxTrackDigits = $trackTitles.length.toString().length;
	const numberFormat = new Intl.NumberFormat('en', { minimumIntegerDigits: maxTrackDigits });

	$trackTitles.each((index, input) => {
		let trackNumber = index + 1;
		if (flags.padNumbers) trackNumber = numberFormat.format(trackNumber);
		let newTitle = prefix + trackNumber;
		if (flags.append) {
			// append the "prefix" and the track number to the old title as a suffix
			newTitle = (input.value + newTitle)
				// ... if it already ended with an alternative punctuation mark, remove any following comma from the "prefix"
				.replace(/([.!?]),/, '$1');
		}
		console.debug(newTitle);
		$(input).val(newTitle);
	}).trigger('change'); // necessary if the tracklist is not the active tab
}
