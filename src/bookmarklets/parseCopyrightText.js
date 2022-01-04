/**
 * - Extracts all copyright data and legal information from the given text.
 * - Assists the user to create release-label relationships for these.
 */

import {
	addCopyrightRelationships,
	parseCopyrightText,
} from '../parseCopyrightText.js';

const input = prompt('Copyright text:');

if (input) {
	const copyrightData = parseCopyrightText(input);
	addCopyrightRelationships(copyrightData);
}
