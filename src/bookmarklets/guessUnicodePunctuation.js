/**
 * Supports the same fields as the userscript but without language detection and granular control over the affected fields.
 */

import { transformationRulesToPreserveMarkup } from '../guessUnicodePunctuation.js';
import { $transformInputValues } from '@kellnerd/es-utils/dom/transformInputValues.js';
import { punctuationRules } from '@kellnerd/es-utils/string/punctuation.js';

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
