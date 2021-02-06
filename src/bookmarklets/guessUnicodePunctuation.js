/**
 * - Searches and replaces ASCII punctuation symbols for all title input fields by their preferred Unicode counterparts.
 *   These can only be guessed based on context as the ASCII symbols are ambiguous.
 * - Highlights all updated input fields in order to allow the user to review the changes.
 * - Works for release/medium/track titles and release disambiguation comments (in the release editor)
 *   and for entity names and disambiguation comments (on their respective edit and creation pages).
 * - Experimental support for annotations and edit notes.
 *   Preserves apostrophe-based markup (bold, italic) but might break URLs if they contain punctuation symbols.
 */

import {
	guessUnicodePunctuation,
	transformationRulesToPreserveMarkup,
} from '../guessUnicodePunctuation';
import { transformInputValues } from '../transformInputValues';

const titleInputSelectors = [
	'input#name', // release title (release editor)
	'input#comment', // release disambiguation comment (release editor)
	'input.track-name', // all track titles (release editor)
	'input[id^=disc-title]', // all medium titles (release editor)
	'input[name$=\\.name]', // entity name (edit pages)
	'input[name$=\\.comment]', // entity disambiguation comment (edit pages)
];

guessUnicodePunctuation(titleInputSelectors);

// guess punctuation of annotations and edit notes
transformInputValues('textarea', transformationRulesToPreserveMarkup);
