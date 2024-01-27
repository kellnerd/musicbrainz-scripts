/**
 * - Asks the user for a recording date (or date range) in the release relationship editor.
 * - Sets the begin and end date for all “recording of” relationships of all selected recordings.
 */

import { updateRelationship } from '../relationship-editor/createRelationship.js';
import { zipObject } from '@kellnerd/es-utils/object/zipObject.js';

/** @type {import('weight-balanced-tree').ImmutableTree<RecordingT> | null} */
const selectedRecordings = MB.relationshipEditor.state.selectedRecordings;

if (selectedRecordings.size) {
	const input = prompt('Begin date and optional end date for all performance relationships (YYYY-MM-DD):');

	if (input !== null) {
		// missing date components will be `undefined`
		const dateMatches = Array.from(input.matchAll(/\d{4}(?:-\d{1,2}(?:-\d{1,2})?)?/g));
		const [beginDate, endDate] = dateMatches.map((match) => zipObject(['year', 'month', 'day'], match[0].split('-')));

		for (const recording of MB.tree.iterate(selectedRecordings)) {
			setRecordingDates(recording, beginDate, endDate);
		}
	}
}

/**
 * Sets the given dates for all performance relationships of the given recording.
 * @param {RecordingT} recording 
 * @param {PartialDateT} beginDate 
 * @param {PartialDateT} [endDate] 
 */
function setRecordingDates(recording, beginDate, endDate) {
	const PERFORMANCE_REL = 278;
	recording.relationships.filter((rel) => rel.linkTypeID === PERFORMANCE_REL).forEach((performanceRel) => {
		updateRelationship(recording, performanceRel, {
			begin_date: beginDate,
			end_date: endDate ?? beginDate,
			ended: true,
		});
	});
}
