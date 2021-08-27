// ==UserScript==
// @name         MusicBrainz: Guess Unicode punctuation
// @version      2021.8.27
// @namespace    https://github.com/kellnerd/musicbrainz-bookmarklets
// @author       kellnerd
// @description  Searches and replaces ASCII punctuation symbols for many input fields by their preferred Unicode counterparts. Provides “Guess punctuation” buttons for titles, names, disambiguation comments, annotations and edit notes on all entity edit and creation pages.
// @homepageURL  https://github.com/kellnerd/musicbrainz-bookmarklets#guess-unicode-punctuation
// @downloadURL  https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/guessUnicodePunctuation.user.js
// @updateURL    https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/guessUnicodePunctuation.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-bookmarklets/issues
// @grant        none
// @match        *://*.musicbrainz.org/*/create
// @match        *://*.musicbrainz.org/release/add
// @match        *://*.musicbrainz.org/*/*/edit
// @match        *://*.musicbrainz.org/*/*/edit_annotation
// ==/UserScript==

(function () {
	'use strict';

	/**
	 * Transforms the values of the selected input fields using the given substitution rules.
	 * Highlights all updated input fields in order to allow the user to review the changes.
	 * @param {string} inputSelector CSS selector of the input fields.
	 * @param {(string|RegExp)[][]} substitutionRules Pairs of values for search & replace.
	 */
	function transformInputValues(inputSelector, substitutionRules) {
		const highlightProperty = 'background-color';
		$(inputSelector)
			.css(highlightProperty, '') // disable possible previously highlighted changes
			.each((_index, input) => {
				/** @type {string} */
				let value = input.value;
				if (!value) {
					return; // skip empty inputs
				}
				substitutionRules.forEach(([searchValue, replaceValue]) => {
					value = value.replace(searchValue, replaceValue);
				});
				if (value != input.value) { // update and highlight changed values
					$(input).val(value)
						.trigger('change')
						.css(highlightProperty, 'yellow');
				}
			});
	}

	const transformationRules = [
		[/(?<=[^\p{L}\d]|^)"(.+?)"(?=[^\p{L}\d]|$)/ug, '“$1”'], // double quoted text
		[/(?<=\W|^)'(n)'(?=\W|$)/ig, '’$1’'], // special case: 'n'
		[/(?<=[^\p{L}\d]|^)'(.+?)'(?=[^\p{L}\d]|$)/ug, '‘$1’'], // single quoted text
		// ... which is enclosed by non-word characters or at the beginning/end of the title
		// [^\p{L}\d] matches Unicode characters which are neither letters nor digits (\W only works with Latin letters)
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
	];

	/**
	 * Preserves apostrophe-based markup and URLs (which are supported by annotations and edit notes)
	 * by temporarily changing them to characters that will not be touched by the transformation rules.
	 * After the punctuation guessing transformation rules were applied, URLs and markup are restored.
	 */
	const transformationRulesToPreserveMarkup = [
		// Base64 encode URLs
		[/\[(.+?)(\|.+?)?\]/g, (_match, url, label = '') => `[${btoa(url)}${label}]`], // labeled link
		[/(?<=\/\/)(\S+)/g, (_match, path) => btoa(path)], // plain text URLs
		[/'''/g, '<b>'], // bold text
		[/''/g, '<i>'], // italic text
		...transformationRules,
		[/<b>/g, "'''"],
		[/<i>/g, "''"],
		// decode Base64 URLs
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
	 */
	function guessUnicodePunctuation(inputSelectors, language) {
		transformInputValues(inputSelectors.join(), transformationRulesForLanguage(language));
	}

	// taken from https://github.com/loujine/musicbrainz-scripts/blob/master/mbz-loujine-common.js
	const languageCodes = {
		'Afrikaans': 'af',
		'Azerbaijani': 'az',
		'Albanian': 'sq',
		'Arabic': 'ar',
		'Armenian': 'hy',
		'Bengali/Bangla': 'bn',
		'Basque': 'eu',
		'Belorussian': 'be',
		'Bosnian': 'bs',
		'Bulgarian': 'bg',
		'Cantonese': 'zh_yue',
		'Catalan': 'ca',
		'Chinese': 'zh',
		'Croatian': 'hr',
		'Czech': 'cs',
		'Danish': 'da',
		'Dutch': 'nl',
		'English': 'en',
		'Esperanto': 'eo',
		'Estonian': 'et',
		'Finnish': 'fi',
		'French': 'fr',
		'German': 'de',
		'Greek': 'el',
		'Hebrew': 'he',
		'Hindi': 'hi',
		'Hungarian': 'hu',
		'Icelandic': 'is',
		'Indonesian': 'id',
		'Irish': 'ga',
		'Italian': 'it',
		'Japanese': 'ja',
		'Javanese': 'jv',
		'Kazakh': 'kk',
		'Khmer (Central)': 'km',
		'Korean': 'ko',
		'Latvian': 'lv',
		'Lithuanian': 'lt',
		'Macedonian': 'mk',
		'Malay': 'ms',
		'Malayam': 'ml',
		'Nepali': 'ne',
		'Norwegian Bokmål': 'nb',
		'Norwegian Nynorsk': 'nn',
		'Persian (Farsi)': 'fa',
		'Polish': 'pl',
		'Portuguese': 'pt',
		'Punjabi': 'pa',
		'Romanian': 'ro',
		'Russian': 'ru',
		'Serbian': 'sr',
		'Serbo-Croatian': 'sh',
		'Slovakian': 'sk',
		'Slovenian': 'sl',
		'Spanish': 'es',
		'Swahili': 'sw',
		'Swedish': 'sv',
		'Thai': 'th',
		'Turkish': 'tr',
		'Urdu': 'ur',
		'Ukrainian': 'uk',
		'Uzbek': 'uz',
		'Vietnamese': 'vi',
		'Welsh (Cymric)': 'cy',
	};

	/**
	 * Detects the selected language in the release editor.
	 * @returns {string} Language as ISO 639-1 two letter code.
	 */
	function detectReleaseLanguage() {
		const languageName = $('#language option:selected').text();
		return languageCodes[languageName];
	}

	var img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAHYgAAB2IBOHqZ2wAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFpSURBVDiNpZOxjwFBGMV/e5FspZeoFETlL9Bug0RDL5FolVpRUqxCr1iNUelUEhmFZqlEVAolFRuxsswVl9uzWVfceeX73nvzfTPzaUIIxRuIAJTL5X+ZR6MRH++cDrwOOBwOdLtdbrdbqDafzxmPx78H2LZNtVplt9txPp993vM8TNOk1WoFeIQQ6htSSmUYhur3++rxePi853mq0WioUqmkttutzwshVOS57U6nQy6Xo1KpBLoaDAYsl0t6vR6pVOr1HViWheM4IfPlcmE4HJLNZkPmQMBqtSIajbJYLFiv175gs9lwvV653+/MZjOOx2MgwB/BdV1OpxPtdhuAYrFIvV73X0JKiZQSXdcxTZN0Oh3sIBaLBZInkwlKqRDvui7T6TQ8gmEYAWE8HkfTNBKJBMlkMlQLjVAoFHAcB9u20XWdWq3mi5rNJpZlsd/vyWQy5PP5n7Tnf/BXCCHU27sQga+t+i8+AYUS9lO02Bg3AAAAAElFTkSuQmCC";

	const buttonTemplate = {
		standard: '<button type="button">Guess punctuation</button>',
		global: '<button type="button" title="Guess punctuation for all supported input fields">Guess punctuation</button>',
		icon: '<button class="icon guess-punctuation" type="button" title="Guess punctuation"></button>',
	};

	/**
	 * Inserts a "Guess punctuation" icon button to the right of the given input field.
	 * @param {string} targetInput CSS selector of the input field.
	 * @returns {JQuery<HTMLElement>} jQuery button element.
	 */
	function insertIconButtonAfter(targetInput) {
		const button = $(buttonTemplate.icon)
			.css('background-image', `url(${img})`); // icon button with a custom image
		$(targetInput)
			.addClass('with-guesscase') // make input smaller to create space for up to two icon buttons
			.after(' ', button); // insert white space and button to the right of the input field
		return button;
	}

	// parse the path of the current page
	const path = window.location.pathname.split('/');
	const entityType = path[1], pageType = path[path.length - 1];

	// insert "Guess punctuation" buttons on all entity edit and creation pages
	if (pageType == 'edit_annotation') { // annotation edit page
		// insert button for entity annotations after the "Preview" button
		$(buttonTemplate.standard)
			.on('click', () => transformInputValues('textarea[name$=text]', transformationRulesToPreserveMarkup))
			.appendTo('.buttons');
	} else if (entityType == 'release') { // release editor
		const releaseInputs = [
			'input#name', // release title
			'input#comment', // release disambiguation comment
		];
		const tracklistInputs = [
			'input.track-name', // all track titles
			'input[id^=medium-title]', // all medium titles
		];
		// button for the release information tab (after disambiguation comment input field)
		insertIconButtonAfter('input#comment')
			.on('click', () => {
				guessUnicodePunctuation(releaseInputs, detectReleaseLanguage());
				transformInputValues('#annotation', transformationRulesToPreserveMarkup); // release annotation
			});
		// button for the tracklist tab (after the guess case button)
		$(buttonTemplate.standard)
			.on('click', () => guessUnicodePunctuation(tracklistInputs, detectReleaseLanguage()))
			.appendTo('.guesscase .buttons');
		// global button (next to the release editor navigation buttons)
		$(buttonTemplate.global)
			.on('click', () => {
				guessUnicodePunctuation([...releaseInputs, ...tracklistInputs], detectReleaseLanguage()); // both release info and tracklist data
				transformInputValues('#edit-note-text', transformationRulesToPreserveMarkup); // edit note
				// exclude annotations from the global action as the changes are hard to verify
			})
			.appendTo('#release-editor > .buttons');
	} else { // edit pages for all other entity types
		const entityInputs = [
			'input[name$=name]', // entity name
			'input[name$=comment]', // entity disambiguation comment
		];
		// button after the disambiguation comment input field
		// tested for: area, artist, event, instrument, label, place, recording, release group, series, work
		// TODO: use lyrics language to localize quotes?
		insertIconButtonAfter('input[name$=comment]') // skipped for url entities as there is no disambiguation input
			.on('click', () => guessUnicodePunctuation(entityInputs));
		// global button after the "Enter edit" button
		$(buttonTemplate.global)
			.on('click', () => {
				guessUnicodePunctuation(entityInputs);
				transformInputValues('.edit-note', transformationRulesToPreserveMarkup); // edit note
			})
			.insertAfter('button.submit');
	}

}());
