/**
 * - Extracts all copyright data and legal information from the given text.
 * - Assists the user to create release-label relationships for these.
 */

import {
	addCopyrightRelationships,
	parseCopyrightNotice,
} from '../parseCopyrightNotice.js';

const input = prompt('Copyright notice:');

if (input) {
	const copyrightData = parseCopyrightNotice(input);
	addCopyrightRelationships(copyrightData);
}
