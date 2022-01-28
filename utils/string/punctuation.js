import { transform } from './transform.js';

/**
 * Default punctuation rules.
 * @type {SubstitutionRule[]}
 */
export const punctuationRules = [
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
	[/(?<=\S)-(?=\S)/g, '‐'], // ... and finally the hyphens should be remaining

	/* rare cases where it is difficult to define precise rules: em dash, minus */
];

/**
 * Language-specific double and single quotes (RegEx replace values).
 * @type {Record<string, string[]>}
 */
const languageSpecificQuotes = {
	English: ['“$1”', '‘$1’'],
	French: ['« $1 »', '‹ $1 ›'],
	German: ['„$1“', '‚$1‘'],
};

/**
 * Indices of the quotation rules (double and single quotes) in `punctuationRules`.
 */
const quotationRuleIndices = [0, 2];

/**
 * Creates language-specific punctuation guessing substitution rules.
 * @param {string} [language] Name of the language (in English).
 */
export function punctuationRulesForLanguage(language) {
	const replaceValueIndex = 1;
	let rules = punctuationRules;

	// overwrite replace values for quotation rules with language-specific values (if they are existing)
	languageSpecificQuotes[language]?.forEach((value, index) => {
		const ruleIndex = quotationRuleIndices[index];
		rules[ruleIndex][replaceValueIndex] = value;
	});

	return rules;
}

/**
 * Searches and replaces ASCII punctuation symbols of the given text by their preferred Unicode counterparts.
 * These can only be guessed based on context as the ASCII symbols are ambiguous.
 * @param {string} text
 * @param {string} [language] Language of the text (English name, optional).
 */
export function guessUnicodePunctuation(text, language) {
	return transform(text, punctuationRulesForLanguage(language));
}
