// ==UserScript==
// @name         MusicBrainz: Guess Unicode punctuation
// @version      2022.6.26
// @namespace    https://github.com/kellnerd/musicbrainz-scripts
// @author       kellnerd
// @description  Searches and replaces ASCII punctuation symbols for many input fields by their preferred Unicode counterparts. Provides “Guess punctuation” buttons for titles, names, disambiguation comments, annotations and edit notes on all entity edit and creation pages.
// @homepageURL  https://github.com/kellnerd/musicbrainz-scripts#guess-unicode-punctuation
// @downloadURL  https://raw.github.com/kellnerd/musicbrainz-scripts/main/dist/guessUnicodePunctuation.user.js
// @updateURL    https://raw.github.com/kellnerd/musicbrainz-scripts/main/dist/guessUnicodePunctuation.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-scripts/issues
// @grant        none
// @include      /^https?://((beta|test)\.)?musicbrainz\.org/(area|artist|event|instrument|label|place|recording|release|release-group|series|work)/create(\?.+?)?(#.+?)?$/
// @include      /^https?://((beta|test)\.)?musicbrainz\.org/release/add(\?.+?)?(#.+?)?$/
// @include      /^https?://((beta|test)\.)?musicbrainz\.org/(area|artist|event|instrument|label|place|recording|release|release-group|series|work)/[0-9a-f-]{36}/edit(_annotation)?(\?.+?)?(#.+?)?$/
// @include      /^https?://((beta|test)\.)?musicbrainz\.org/artist/[0-9a-f-]{36}/credit/\d+/edit(\?.+?)?(#.+?)?$/
// ==/UserScript==

(function () {
	'use strict';

	/**
	 * Returns a reference to the first DOM element with the specified value of the ID attribute.
	 * @param {string} elementId String that specifies the ID value.
	 */
	function dom(elementId) {
		return document.getElementById(elementId);
	}

	/**
	 * Returns the first element that is a descendant of node that matches selectors.
	 * @param {string} selectors 
	 * @param {ParentNode} node 
	 */
	function qs(selectors, node = document) {
		return node.querySelector(selectors);
	}

	/**
	 * Returns all element descendants of node that match selectors.
	 * @param {string} selectors 
	 * @param {ParentNode} node 
	 */
	function qsa(selectors, node = document) {
		return node.querySelectorAll(selectors);
	}

	/**
	 * Transforms the given value using the given substitution rules.
	 * @param {string} value
	 * @param {SubstitutionRule[]} substitutionRules Pairs of values for search & replace.
	 * @returns {string}
	 */
	function transform(value, substitutionRules) {
		substitutionRules.forEach(([searchValue, replaceValue]) => {
			value = value.replace(searchValue, replaceValue);
		});
		return value;
	}

	// Adapted from https://stackoverflow.com/a/46012210

	const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

	/**
	 * Sets the value of an input element which has been manipulated by React.
	 * @param {HTMLInputElement} input 
	 * @param {string} value 
	 */
	function setReactInputValue(input, value) {
		nativeInputValueSetter.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}

	const defaultHighlightClass = 'content-changed';

	/**
	 * Transforms the values of the selected input fields using the given substitution rules.
	 * Highlights all updated input fields in order to allow the user to review the changes.
	 * @param {string} inputSelector CSS selector of the input fields.
	 * @param {SubstitutionRule[]} substitutionRules Pairs of values for search & replace.
	 * @param {object} [options]
	 * @param {boolean} [options.isReactInput] Whether the input fields are manipulated by React.
	 * @param {Event} [options.event] Event which should be triggered for changed input fields (optional, defaults to 'change').
	 * @param {string} [options.highlightClass] CSS class which should be applied to changed input fields (optional, defaults to `defaultHighlightClass`).
	 */
	function transformInputValues(inputSelector, substitutionRules, {
		isReactInput = false,
		event = new Event('change'),
		highlightClass = defaultHighlightClass,
	} = {}) {
		qsa(inputSelector).forEach((/** @type {HTMLInputElement} */ input) => {
			input.classList.remove(highlightClass); // disable possible previously highlighted changes
			let value = input.value;

			if (!value) {
				return; // skip empty inputs
			}

			value = transform(value, substitutionRules);

			if (value != input.value) { // update and highlight changed values
				if (isReactInput) {
					setReactInputValue(input, value);
				} else {
					input.value = value;
					input.dispatchEvent(event);
				}
				input.classList.add(highlightClass);
			}
		});
	}

	/**
	 * Default punctuation rules.
	 * @type {SubstitutionRule[]}
	 */
	const punctuationRules = [
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
	 * Additional punctuation rules for certain languages, will be appended to the default rules.
	 * @type {Record<string, SubstitutionRule[]>}
	 */
	const languageSpecificRules = {
		German: [
			[/(\w+)-(\s)|(\s)-(\w+)/g, '$1$3‐$2$4'], // hyphens for abbreviated compound words
		],
		Japanese: [
			[/(?<=[^\p{L}\d]|^)-(.+?)-(?=[^\p{L}\d]|$)/ug, '–$1–'], // dashes used as brackets
		],
	};

	/**
	 * Creates language-specific punctuation guessing substitution rules.
	 * @param {string} [language] Name of the language (in English).
	 */
	function punctuationRulesForLanguage(language) {
		// create a deep copy to prevent modifications of the default rules
		let rules = [...punctuationRules]; 

		// overwrite replace values for quotation rules with language-specific values (if they are existing)
		const replaceValueIndex = 1;
		languageSpecificQuotes[language]?.forEach((value, index) => {
			const ruleIndex = quotationRuleIndices[index];
			rules[ruleIndex][replaceValueIndex] = value;
		});

		// append language-specific rules (if they are existing)
		languageSpecificRules[language]?.forEach((rule) => {
				rules.push(rule);
		});

		return rules;
	}

	/**
	 * Preserves apostrophe-based markup and URLs (which are supported by annotations and edit notes)
	 * by temporarily changing them to characters that will not be touched by the transformation rules.
	 * After the punctuation guessing transformation rules were applied, URLs and markup are restored.
	 * @type {SubstitutionRule[]}
	 */
	const transformationRulesToPreserveMarkup = [
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
	 * @param {string} [options.language] Language of the input fields' text (English name, optional).
	 * @param {boolean} [options.isReactInput] Whether the input fields are manipulated by React.
	 * @param {Event} [options.event] Event which should be triggered for changed input fields (optional).
	 */
	function guessUnicodePunctuation(inputSelectors, options = {}) {
		transformInputValues(inputSelectors.join(), punctuationRulesForLanguage(options.language), options);
	}

	// MB languages as of 2021-10-04, extracted from the HTML source code of the release editor's language select menu
	const frequentLanguageIDs = {
		284: '[Multiple languages]',
		18: 'Arabic',
		76: 'Chinese',
		113: 'Dutch',
		120: 'English',
		131: 'Finnish',
		134: 'French',
		145: 'German',
		159: 'Greek',
		171: 'Hindi',
		195: 'Italian',
		198: 'Japanese',
		224: 'Korean',
		309: 'Norwegian',
		338: 'Polish',
		340: 'Portuguese',
		353: 'Russian',
		393: 'Spanish',
		403: 'Swedish',
		433: 'Turkish',
	};

	/**
	 * Detects the selected language in the release editor.
	 * @returns {string} Name of the language (in English).
	 */
	function detectReleaseLanguage() {
		// get the ID of the selected language, the name (text value) is localization-dependent
		const languageID = dom('language')?.selectedOptions[0].value;
		if (languageID) {
			// check only frequent languages (for most of the others we have no special features anyway; also reduces bundle size)
			return frequentLanguageIDs[languageID];
		}
	}

	/**
	 * Creates a DOM element from the given HTML fragment.
	 * @param {string} html HTML fragment.
	 */
	function createElement(html) {
		const template = document.createElement('template');
		template.innerHTML = html;
		return template.content.firstElementChild;
	}

	/**
	 * Creates a style element from the given CSS fragment and injects it into the document's head.
	 * @param {string} css CSS fragment.
	 * @param {string} userscriptName Name of the userscript, used to generate an ID for the style element.
	 */
	function injectStylesheet(css, userscriptName) {
		const style = document.createElement('style');
		if (userscriptName) {
			style.id = [userscriptName, 'userscript-css'].join('-');
		}
		style.innerText = css;
		document.head.append(style);
	}

	var img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAHYgAAB2IBOHqZ2wAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFpSURBVDiNpZOxjwFBGMV/e5FspZeoFETlL9Bug0RDL5FolVpRUqxCr1iNUelUEhmFZqlEVAolFRuxsswVl9uzWVfceeX73nvzfTPzaUIIxRuIAJTL5X+ZR6MRH++cDrwOOBwOdLtdbrdbqDafzxmPx78H2LZNtVplt9txPp993vM8TNOk1WoFeIQQ6htSSmUYhur3++rxePi853mq0WioUqmkttutzwshVOS57U6nQy6Xo1KpBLoaDAYsl0t6vR6pVOr1HViWheM4IfPlcmE4HJLNZkPmQMBqtSIajbJYLFiv175gs9lwvV653+/MZjOOx2MgwB/BdV1OpxPtdhuAYrFIvV73X0JKiZQSXdcxTZN0Oh3sIBaLBZInkwlKqRDvui7T6TQ8gmEYAWE8HkfTNBKJBMlkMlQLjVAoFHAcB9u20XWdWq3mi5rNJpZlsd/vyWQy5PP5n7Tnf/BXCCHU27sQga+t+i8+AYUS9lO02Bg3AAAAAElFTkSuQmCC";
	  var guessPunctuationIcon = img;

	const buttonTemplate = {
		standard: '<button type="button">Guess punctuation</button>',
		global: '<button type="button" title="Guess punctuation for all supported input fields">Guess punctuation</button>',
		icon: '<button class="icon guess-punctuation" type="button" title="Guess punctuation"></button>',
	};

	const styles =
`button.icon.guess-punctuation {
	background-image: url(${guessPunctuationIcon});
}
input.${defaultHighlightClass}, textarea.${defaultHighlightClass} {
	background-color: yellow !important;
}`	;

	/**
	 * Inserts a "Guess punctuation" icon button to the right of the given input field.
	 * @param {string} targetInput CSS selector of the input field.
	 * @returns {HTMLButtonElement} DOM button element.
	 */
	function insertIconButtonAfter(targetInput) {
		const target = qs(targetInput);
		if (!target) return null;

		const button = createElement(buttonTemplate.icon);
		target.classList.add('with-guesscase'); // make input smaller to create space for up to two icon buttons
		target.parentNode.append(' ', button); // insert white space and button to the right of the input field

		return button;
	}

	/**
	 * Inserts a "Guess punctuation" button into the artist credit bubble of the edit page.
	 * Only works if the bubble is already present in the DOM (it can be hidden, but must have been open at least once).
	 * Therefore this function should be used as callback of an event listener.
	 * @param {Event} event
	 */
	function insertACButton(event) {
		// remove this function from the event listeners after the first event to avoid duplicate buttons
		if (event) {
			qsa('.open-ac').forEach((button) => button.removeEventListener(event.type, insertACButton));
		}

		const acBubbleButtons = qs('#artist-credit-bubble .buttons');

		if (!acBubbleButtons) {
			setTimeout(insertACButton, 50); // wait for the AC bubble to appear in the DOM
			return;
		}

		const button = createElement(buttonTemplate.standard);
		button.addEventListener('click', () => guessUnicodePunctuation(acInputs, { isReactInput: true }));
		acBubbleButtons.append(button);
	}

	const acInputs = [
		'input[id*=credited-as]', // all artist names as credited (inside the artist credit bubble)
	];


	injectStylesheet(styles, 'guess-punctuation');

	// parse the path of the current page
	const path = window.location.pathname.split('/');
	let entityType = path[1], pageType = path[path.length - 1];

	if (entityType == 'artist' && path[3] == 'credit') {
		entityType = 'artist-credit';
	}

	// insert "Guess punctuation" buttons on all entity edit and creation pages
	if (pageType == 'edit_annotation') { // annotation edit page
		// insert button for entity annotations after the "Preview" button
		const button = createElement(buttonTemplate.standard);
		button.addEventListener('click', () => transformInputValues('textarea[name$=text]', transformationRulesToPreserveMarkup));
		qs('.buttons').append(button);
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
		insertIconButtonAfter(releaseInputs[1])
			.addEventListener('click', () => {
				guessUnicodePunctuation(releaseInputs, { language: detectReleaseLanguage() });
				transformInputValues('#annotation', transformationRulesToPreserveMarkup); // release annotation
			});

		// button for the tracklist tab (after the guess case button)
		const tracklistButton = createElement(buttonTemplate.standard);
		tracklistButton.addEventListener('click', () => guessUnicodePunctuation(tracklistInputs, { language: detectReleaseLanguage() }));
		qs('.guesscase .buttons').append(tracklistButton);

		// global button (next to the release editor navigation buttons)
		const globalButton = createElement(buttonTemplate.global);
		globalButton.addEventListener('click', () => {
			// both release info and tracklist data
			guessUnicodePunctuation([...releaseInputs, ...tracklistInputs], { language: detectReleaseLanguage() });
			transformInputValues('#edit-note-text', transformationRulesToPreserveMarkup); // edit note
			// exclude annotations from the global action as the changes are hard to verify
		});
		qs('#release-editor > .buttons').append(globalButton);
	} else if (entityType != 'artist-credit') { // edit pages for all other entity types (except ACs)
		const entityInputs = [
			'input[name$=name]', // entity name
			'input[name$=comment]', // entity disambiguation comment
		];

		// on artist edit pages we need a different event to trigger the artist credit renamer on name changes
		const event = (entityType === 'artist') ? new Event('input', { bubbles: true }) : undefined;

		// button after the disambiguation comment input field
		// tested for: area, artist, event, instrument, label, place, recording, release group, series, work
		// TODO: use lyrics language to localize quotes?
		insertIconButtonAfter(entityInputs[1]) // skipped for url entities as there is no disambiguation input
			?.addEventListener('click', () => guessUnicodePunctuation(entityInputs, { event }));

		// global button after the "Enter edit" button
		const button = createElement(buttonTemplate.global);
		button.addEventListener('click', () => {
			guessUnicodePunctuation(entityInputs, { event });
			transformInputValues('.edit-note', transformationRulesToPreserveMarkup); // edit note
		});
		qs('button.submit').parentNode.append(button);
	}

	// handle edit pages with artist credit bubbles
	if (['artist-credit', 'release', 'release-group', 'recording'].includes(entityType)) {
		// wait a moment until the button which opens the AC bubble is available
		setTimeout(() => qsa('.open-ac').forEach((button) => {
			// wait for the artist credit bubble to be opened before inserting the guess button
			button.addEventListener('click', insertACButton);

			if (entityType === 'release') {
				// remove old highlights that might be from a different AC which has been edited previously
				button.addEventListener('click', () => qsa(acInputs.join()).forEach(
					(input) => input.classList.remove(defaultHighlightClass)
				));
			}
		}), 100);
	}

})();
