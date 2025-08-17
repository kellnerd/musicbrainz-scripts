import { transformInputValues } from '@kellnerd/es-utils/dom/transformInputValues.js';
import { transform } from '@kellnerd/es-utils/string/transform.js';
import {
	punctuationRules,
	punctuationRulesForLanguage,
} from '@kellnerd/es-utils/string/punctuation.js';

/**
 * Preserves apostrophe-based markup and URLs (which are supported by annotations and edit notes)
 * by temporarily changing them to characters that will not be touched by the transformation rules.
 * After the punctuation guessing transformation rules were applied, URLs and markup are restored.
 * @type {import('@kellnerd/es-utils').SubstitutionRule[]}
 */
export const transformationRulesToPreserveMarkup = [
	/* Base64 encode URLs */
	[/\[(.+?)(\|.+?)?\]/g, (_match, url, label = '') => `[${btoa(url)}${label}]`], // labeled link
	[/(?<=\/\/)(\S+)/g, (_match, path) => btoa(path)], // plain text URLs

	[/'''/g, '<b>'], // bold text
	[/''/g, '<i>'], // italic text

	...punctuationRules,

	[/<b>/g, "'''"],
	[/<i>/g, "''"],

	/* decode Base64 URLs */
	[/(?<=\/\/)([A-Za-z0-9+/=]+)/g, (_match, path) => atob(path)], // plain text URLs
	[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g, (_match, url, label = '') => `[${atob(url)}${label}]`], // labeled link
];

/**
 * Searches and replaces ASCII punctuation symbols for all given input fields by their preferred Unicode counterparts.
 * These can only be guessed based on context as the ASCII symbols are ambiguous.
 * @param {string[]} inputSelectors CSS selectors of the input fields.
 * @param {object} options
 * @param {string} [options.language] Language of the input fields' text (ISO 639-1 two letter code, optional).
 * @param {boolean} [options.isReactInput] Whether the input fields are manipulated by React.
 * @param {Event} [options.event] Event which should be triggered for changed input fields (optional).
 */
export function guessUnicodePunctuation(inputSelectors, options = {}) {
	transformInputValues(inputSelectors.join(), punctuationRulesForLanguage(options.language), options);
}

/**
 * Searches and replaces ASCII punctuation symbols of the given text by their preferred Unicode counterparts.
 * These can only be guessed based on context as the ASCII symbols are ambiguous.
 * @param {string} text
 */
export function guessUnicodePunctuationOf(text) {
	return transform(text, punctuationRules);
}
