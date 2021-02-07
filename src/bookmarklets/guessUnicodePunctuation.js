/**
 * - Searches and replaces ASCII punctuation symbols for all title input fields by their preferred Unicode counterparts.
 *   These can only be guessed based on context as the ASCII symbols are ambiguous.
 * - Highlights all updated input fields in order to allow the user to review the changes.
 * - Works for release/medium/track titles (in the release editor) and for recording/work titles (on their respective edit pages).
 */

import { guessUnicodePunctuation } from '../guessUnicodePunctuation';

const titleInputSelectors = [
	'input#name', // release title (release editor)
	'input.track-name', // all track titles (release editor)
	'input[id^=disc-title]', // all medium titles (release editor)
	'#id-edit-recording\\.name', // recording name (recording editor)
	'#id-edit-work\\.name', // work name (work editor)
];

guessUnicodePunctuation(titleInputSelectors);
