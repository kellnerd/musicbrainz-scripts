import { transformInputValues } from './transformInputValues.js';

export const transformationRules = [
	/* quoted text */
	[/(?<=[^\p{L}\d]|^)"(.+?)"(?=[^\p{L}\d]|$)/ug, '“$1”'], // double quoted text
	[/(?<=\W|^)'(n)'(?=\W|$)/ig, '’$1’'], // special case: 'n'
	[/(?<=[^\p{L}\d]|^)'(.+?)'(?=[^\p{L}\d]|$)/ug, '‘$1’'], // single quoted text
	// ... which is enclosed by non-word characters or at the beginning/end of the title
	// [^\p{L}\d] matches Unicode characters which are neither letters nor digits (\W only works with Latin letters)

	/* primes */
	[/(\d+)"/g, '$1″'], // double primes, e.g. for 12″
	[/(\d+)'(\d+)/g, '$1′$2'], // single primes, e.g. for 3′42″ but not for 70’s

	/* apostrophes */
	[/'/g, '’'], // ... and finally the apostrophes should be remaining

	/* ellipses */
	[/(?<!\.)\.{3}(?!\.)/g, '…'], // horizontal ellipsis (but not more than three dots)

	/* dashes */
	[/ - /g, ' – '], // en dash as separator

	/* hyphens for (partial) ISO 8601 dates, e.g. 1987‐07–30 or 2016-04 */
	[/\d{4}-\d{2}(?:-\d{2})?(?=\W|$)/g, (potentialDate) => {
		if (Number.isNaN(Date.parse(potentialDate))) return potentialDate; // skip invalid date strings, e.g. 1989-90
		return potentialDate.replaceAll('-', '‐');
	}],

	/* figure dashes: separate three or more groups of digits (two groups could be range) */
	[/\d+(-\d+){2,}/g, (groupedDigits) => groupedDigits.replaceAll('-', '‒')],

	[/(\d+)-(\d+)/g, '$1–$2'], // en dash for ranges where it means "to", e.g. 1965–1972

	/* hyphens */
	[/-/g, '‐'], // ... and finally the hyphens should be remaining

	/* rare cases where it is difficult to define precise rules: em dash, minus */
];

/**
 * Preserves apostrophe-based markup and URLs (which are supported by annotations and edit notes)
 * by temporarily changing them to characters that will not be touched by the transformation rules.
 * After the punctuation guessing transformation rules were applied, URLs and markup are restored.
 */
export const transformationRulesToPreserveMarkup = [
	/* Base64 encode URLs */
	[/\[(.+?)(\|.+?)?\]/g, (_match, url, label = '') => `[${btoa(url)}${label}]`], // labeled link
	[/(?<=\/\/)(\S+)/g, (_match, path) => btoa(path)], // plain text URLs

	[/'''/g, '<b>'], // bold text
	[/''/g, '<i>'], // italic text

	...transformationRules,

	[/<b>/g, "'''"],
	[/<i>/g, "''"],

	/* decode Base64 URLs */
	[/(?<=\/\/)([A-Za-z0-9+/=]+)/g, (_match, path) => atob(path)], // plain text URLs
	[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g, (_match, url, label = '') => `[${atob(url)}${label}]`], // labeled link
];

/**
 * Language-specific double and single quotes (RegEx replace values).
 * @type {Record<string,string[]>}
 */
const languageSpecificQuotes = {
	de: ['„$1“', '‚$1‘'], // German
	en: ['“$1”', '‘$1’'], // English
	fr: ['« $1 »', '‹ $1 ›'], // French
};

/**
 * Indices of the quotation rules (double and single quotes) in `transformationRules`.
 */
const quotationRuleIndices = [0, 2];

/**
 * Creates language-specific punctuation guessing transformation rules.
 * @param {string} [language] ISO 639-1 two letter language code.
 */
function transformationRulesForLanguage(language) {
	const replaceValueIndex = 1;
	let rules = transformationRules;
	// overwrite replace values for quotation rules with language-specific values (if they are existing)
	languageSpecificQuotes[language]?.forEach((value, index) => {
		const ruleIndex = quotationRuleIndices[index];
		rules[ruleIndex][replaceValueIndex] = value;
	});
	return rules;
}

/**
 * Searches and replaces ASCII punctuation symbols for all given input fields by their preferred Unicode counterparts.
 * These can only be guessed based on context as the ASCII symbols are ambiguous.
 * @param {string[]} inputSelectors CSS selectors of the input fields.
 * @param {string} [language] Language of the input fields' text (ISO 639-1 two letter code, optional).
 * @param {Event} [event] Event which should be triggered for changed input fields (optional).
 */
export function guessUnicodePunctuation(inputSelectors, language, event) {
	transformInputValues(inputSelectors.join(), transformationRulesForLanguage(language), event);
}
