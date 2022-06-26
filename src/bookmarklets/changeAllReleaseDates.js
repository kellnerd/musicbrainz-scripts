/**
 * - Changes the date for all release events of a release according to the user's input.
 * - Useful to correct the dates for digital media releases with lots of release events which are using the wrong first
 *   release date of the release group.
 */

import { changeAllReleaseDates } from '../changeAllReleaseDates.js';

const input = prompt('Date for all release events (YYYY-MM-DD):');

if (input !== null) {
	const [, year, month, day] = /(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(input) // missing parts will be `undefined`
		|| []; // input does not match a date, set all values to `undefined`
	changeAllReleaseDates(year, month, day);
}
