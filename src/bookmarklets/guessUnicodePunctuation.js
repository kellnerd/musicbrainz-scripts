/**
 * - Searches and replaces ASCII punctuation symbols for all title input fields by their preferred Unicode counterparts.
 *   These can only be guessed based on context as the ASCII symbols are ambiguous.
 * - Highlights all updated input fields in order to allow the user to review the changes.
 * - Works for release/medium/track titles and release disambiguation comments (in the release editor)
 *   and for entity names and disambiguation comments (on their respective edit and creation pages).
 * - Detects the selected language (in the release editor) and uses localized quotes (userscript only).
 * - Experimental support for annotations and edit notes. Preserves apostrophe-based markup (bold, italic) and URLs.
 */

import { transformationRulesToPreserveMarkup } from '../guessUnicodePunctuation.js';
import { $transformInputValues } from '../../utils/dom/transformInputValues.js';
import { punctuationRules } from '../../utils/string/punctuation.js';

const titleInputSelectors = [
	'input#name', // release title (release editor)
	'input#comment', // release disambiguation comment (release editor)
	'input.track-name', // all track titles (release editor)
	'input[id^=medium-title]', // all medium titles (release editor)
	'input[name$=name]', // entity name (edit pages)
	'input[name$=comment]', // entity disambiguation comment (edit pages)
];

const textareaSelectors = [
	'#annotation', // release annotation (release editor)
	'#edit-note-text', // edit note (release editor)
	'textarea[name$=text]', // annotation (edit annotation pages)
	'.edit-note', // edit note (edit pages)
];

$transformInputValues(titleInputSelectors.join(), punctuationRules);
$transformInputValues(textareaSelectors.join(), transformationRulesToPreserveMarkup);
