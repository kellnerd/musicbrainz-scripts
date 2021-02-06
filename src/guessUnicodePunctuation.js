import { transformInputValues } from './transformInputValues';

export const transformationRules = [
	[/(?<=\W|^)"(.+?)"(?=\W|$)/g, '“$1”'], // double quoted text
	[/(?<=\W|^)'n'(?=\W|$)/g, '’n’'], // special case: 'n'
	[/(?<=\W|^)'(.+?)'(?=\W|$)/g, '‘$1’'], // single quoted text
	// ... which is enclosed by non-word characters or at the beginning/end of the title
	[/(\d+)"/g, '$1″'], // double primes, e.g. for 12″
	[/(\d+)'(\d+)/g, '$1′$2'], // single primes, e.g. for 3′42″ but not for 70’s
	[/'/g, '’'], // ... and finally the apostrophes should be remaining
	[/(?<!\.)\.{3}(?!\.)/g, '…'], // horizontal ellipsis (but not more than three dots)
	[/ - /g, ' – '], // en dash as separator
	[/(\d{4})-(\d{2})-(\d{2})(?=\W|$)/g, '$1‐$2‐$3'], // hyphens for ISO 8601 dates, e.g. 1987‐07–30
	[/(\d{4})-(\d{2})(?=\W|$)/g, '$1‐$2'], // hyphen for ISO 8601 partial dates, e.g. 2016-04
	[/(\d+)-(\d+)/g, '$1–$2'], // en dash for ranges where it means "to", e.g. 1965–1972
	[/-/g, '‐'], // ... and finally the hyphens should be remaining
	// difficult to find rules for: em dash (rare), minus (very rare), figure dash (very rare)
	// TODO: localize quotes using release/lyrics language
];

export const transformationRulesToPreserveMarkup = [
	[/'''/g, '<b>'], // bold text (temporary change to preserve apostrophe-based markup)
	[/''/g, '<i>'], // italic text (temporary change)
	...transformationRules,
	/* restore apostrophe-based markup (used for annotations and edit notes on MusicBrainz) */
	[/<b>/g, "'''"],
	[/<i>/g, "''"],
];

/**
 * Searches and replaces ASCII punctuation symbols for all given input fields by their preferred Unicode counterparts.
 * These can only be guessed based on context as the ASCII symbols are ambiguous.
 * @param {string[]} inputSelectors CSS selectors of the input fields.
 */
export function guessUnicodePunctuation(inputSelectors) {
	transformInputValues(inputSelectors.join(), transformationRules);
}
