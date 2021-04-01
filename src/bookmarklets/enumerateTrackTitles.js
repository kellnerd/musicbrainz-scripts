/**
 * - Renames all tracks using their absolute track number and a customizable prefix (which can be empty).
 * - Useful to number the parts of an audiobook without chapters and other releases with untitled tracks.
 * - Asks the user to input a numbering prefix which can optionally be preceded by flags:
 *   - Append the number (including the given prefix) to the current titles: `+`
 *   - Pad numbers with leading zeros to the same length: `_`
 *   - *Example*: `+_, Part ` renames track 27/143 "Title" to "Title, Part 027"
 */

import { enumerateTrackTitles } from '../enumerateTrackTitles';

const userInput = prompt('Numbering prefix, preceded by flags:\n+ append to current titles\n_ pad numbers', 'Part ');

if (userInput !== null) {
	// if the user has not clicked "Cancel", parse the input to extract flags and the number prefix
	let [, flags, prefix] = userInput.match(/^([+_]*)(.*)/);
	flags = {
		append: flags.includes('+'),
		padNumbers: flags.includes('_'),
	};
	enumerateTrackTitles(prefix, flags);
}
