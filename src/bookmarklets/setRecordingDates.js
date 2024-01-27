/**
 * - Asks the user for a recording date in the release relationship editor.
 * - Sets the date for all “recording of” relationships of all selected recordings.
 */

import { updateRelationship } from '../relationship-editor/createRelationship.js';

/** @type {import('weight-balanced-tree').ImmutableTree<RecordingT> | null} */
const selectedRecordings = MB.relationshipEditor.state.selectedRecordings;

if (selectedRecordings.size) {
	const input = prompt('Date for all performance relationships (YYYY-MM-DD):');

	if (input !== null) {
		// missing date components will be `undefined`
		const [, year, month, day] = /(\d{4})(?:-0?(\d{1,2})(?:-0?(\d{1,2}))?)?/.exec(input) || [];

		for (const recording of MB.tree.iterate(selectedRecordings)) {
			setRecordingDates(recording, { day, month, year });
		}
	}
}

/**
 * Sets the given date for all performance relationships of the given recording.
 * @param {RecordingT} recording 
 * @param {PartialDateT} date 
 */
function setRecordingDates(recording, date) {
	const PERFORMANCE_REL = 278;
	recording.relationships.filter((rel) => rel.linkTypeID === PERFORMANCE_REL).forEach((performanceRel) => {
		updateRelationship(recording, performanceRel, {
			begin_date: date,
			end_date: date,
			ended: true,
		});
	});
}
