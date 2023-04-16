/**
 * - Clears medium titles if they are redundant and contain only the medium format and position.
 * - Adds a link to the relevant guideline to the edit note.
 */

import { dom, qsa } from '@kellnerd/es-utils/dom/select.js';
import { setInputValue } from '@kellnerd/es-utils/dom/setInputValue.js';

qsa('input[id^=medium-title]').forEach((titleInput) =>
	setInputValue(titleInput, titleInput.value.replace(/^(Cassette|CD|Dis[ck]|DVD|SACD|Vinyl)\s*\d+/i, '').trim())
);

const editNoteInput = dom('edit-note-text');
setInputValue(editNoteInput,
	'Clear redundant medium titles, see https://musicbrainz.org/doc/Style/Release#Medium_title\n' + editNoteInput.value);
