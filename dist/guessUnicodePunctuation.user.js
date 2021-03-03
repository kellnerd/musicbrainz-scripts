// ==UserScript==
// @name         MusicBrainz: Guess Unicode punctuation
// @version      2021.3.4
// @namespace    https://github.com/kellnerd/musicbrainz-bookmarklets
// @author       kellnerd
// @description  Searches and replaces ASCII punctuation symbols for many text input fields by their preferred Unicode counterparts. Provides a "Guess punctuation" button for titles, names and disambiguation comments on all entity edit and creation pages.
// @homepageURL  https://github.com/kellnerd/musicbrainz-bookmarklets#guess-unicode-punctuation
// @downloadURL  https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/guessUnicodePunctuation.user.js
// @updateURL    https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/guessUnicodePunctuation.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-bookmarklets/issues
// @grant        none
// @match        *://*.musicbrainz.org/artist/*/edit
// @match        *://*.musicbrainz.org/artist/create
// @match        *://*.musicbrainz.org/event/*/edit
// @match        *://*.musicbrainz.org/event/create
// @match        *://*.musicbrainz.org/label/*/edit
// @match        *://*.musicbrainz.org/label/create
// @match        *://*.musicbrainz.org/place/*/edit
// @match        *://*.musicbrainz.org/place/create
// @match        *://*.musicbrainz.org/recording/*/edit
// @match        *://*.musicbrainz.org/recording/create
// @match        *://*.musicbrainz.org/release/*/edit
// @match        *://*.musicbrainz.org/release/add
// @match        *://*.musicbrainz.org/release-group/*/edit
// @match        *://*.musicbrainz.org/release-group/create
// @match        *://*.musicbrainz.org/series/*/edit
// @match        *://*.musicbrainz.org/series/create
// @match        *://*.musicbrainz.org/work/*/edit
// @match        *://*.musicbrainz.org/work/create
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
		$(inputSelector).css('background-color', ''); // disable possible previously highlighted changes
		$(inputSelector).each((_index, input) => {
			let value = input.value;
			if (!value)
				return; // skip empty inputs
			substitutionRules.forEach(([searchValue, newValue]) => {
				value = value.replace(searchValue, newValue);
			});
			if (value != input.value) { // update and highlight changed values
				$(input).val(value)
					.trigger('change')
					.css('background-color', 'yellow');
			}
		});
	}

	const transformationRules = [
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

	/**
	 * Searches and replaces ASCII punctuation symbols for all given input fields by their preferred Unicode counterparts.
	 * These can only be guessed based on context as the ASCII symbols are ambiguous.
	 * @param {string[]} inputSelectors CSS selectors of the input fields.
	 */
	function guessUnicodePunctuation(inputSelectors) {
		transformInputValues(inputSelectors.join(), transformationRules);
	}

	var img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAHYgAAB2IBOHqZ2wAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFpSURBVDiNpZOxjwFBGMV/e5FspZeoFETlL9Bug0RDL5FolVpRUqxCr1iNUelUEhmFZqlEVAolFRuxsswVl9uzWVfceeX73nvzfTPzaUIIxRuIAJTL5X+ZR6MRH++cDrwOOBwOdLtdbrdbqDafzxmPx78H2LZNtVplt9txPp993vM8TNOk1WoFeIQQ6htSSmUYhur3++rxePi853mq0WioUqmkttutzwshVOS57U6nQy6Xo1KpBLoaDAYsl0t6vR6pVOr1HViWheM4IfPlcmE4HJLNZkPmQMBqtSIajbJYLFiv175gs9lwvV653+/MZjOOx2MgwB/BdV1OpxPtdhuAYrFIvV73X0JKiZQSXdcxTZN0Oh3sIBaLBZInkwlKqRDvui7T6TQ8gmEYAWE8HkfTNBKJBMlkMlQLjVAoFHAcB9u20XWdWq3mi5rNJpZlsd/vyWQy5PP5n7Tnf/BXCCHU27sQga+t+i8+AYUS9lO02Bg3AAAAAElFTkSuQmCC";

	const pageEntityType = window.location.pathname.split('/')[1];

	// insert a "Guess punctuation" button on all entity edit and creation pages
	if (pageEntityType == 'release') {
		$('<button type="button">Guess punctuation</button>')
			.on('click', () => {
				guessUnicodePunctuation([
					'input#name', // release title
					'input#comment', // release title
					'input.track-name', // all track titles
					'input[id^=disc-title]', // all medium titles
				]);
			})
			.appendTo('.guesscase .buttons'); // insert button after the guess case button in the tracklist tab
	} else { // all other entity types (except url): artist, event, label, place, recording, release group, series, work
		const button = $('<button class="icon" type="button" title="Guess punctuation"></button>')
			.on('click', () => {
				guessUnicodePunctuation([
					'input[name$=\\.name]', // entity name
					'input[name$=\\.comment]', // entity disambiguation comment
				]);
			})
			.css('background-image', `url(${img})`); // icon button with a custom image
		$('input[name$=\\.comment]')
			.addClass('with-guesscase') // make input smaller to create space for up to two icon buttons
			.after(' ', button); // insert white space and button to the right of the disambiguation comment input field
	}

}());
