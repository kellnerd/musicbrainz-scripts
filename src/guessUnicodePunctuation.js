/**
 * Transforms the values of the selected input fields using the given substitution rules.
 * @param {string} inputSelector CSS selector of the input fields.
 * @param {(string|RegExp)[][]} substitutionRules Pairs of values for search & replace.
 */
function transformInputValues(inputSelector, substitutionRules) {
	$(inputSelector).css('background-color', ''); // disable possible previously highlighted changes
	$(inputSelector).each((_index, input) => {
		let value = input.value;
		substitutionRules.forEach(([searchValue, newValue]) => {
			value = value.replace(searchValue, newValue);
			console.debug(value);
		});
		if (value != input.value) { // update and highlight changed values
			$(input).val(value)
				.trigger('change')
				.css('background-color', 'yellow');
		}
	});
}

/**
 * Searches and replaces ASCII punctuation symbols for all title input fields by their preferred Unicode counterparts.
 * These can only be guessed based on context as the ASCII symbols are ambiguous.
 */
function guessUnicodePunctuation() {
	const titleInputSelectors = [
		'input#name', // release title (release editor)
		'input.track-name', // all track titles (release editor)
		'#id-edit-recording\\.name', // recording name (recording editor)
		'#id-edit-work\\.name', // work name (work editor)
	];
	const transformationRules = [
		[/(?<!\S)"(.+?)"(?!\S)/g, '“$1”'], // double quotes
		[/(?<!\S)'(.+?)'(?!\S)/g, '‘$1’'], // single quotes
		// ... which are not following / followed by non-whitespace characters
		[/(\d+)"/g, '$1″'], // double primes, e.g. for 12″
		[/(\d+)'(\d+)/g, '$1′$2'], // single primes, e.g. for 3′42″ but not for 70’s
		[/'/g, '’'], // ... and finally the apostrophes should be remaining
		[/(?<!\.)\.{3}(?!\.)/g, '…'], // horizontal ellipsis (but not more than three dots)
		[/ - /g, ' – '], // en dash
		[/(\d+)-(\d+)/g, '$1–$2'], // en dash for ranges where it means "to", e.g. 1965–1972
		[/-/g, '‐'], // hyphen
		// difficult to find rules for: em dash (rare), minus (very rare), figure dash (very rare)
		// TODO: localize quotes using release/lyrics language
	];
	transformInputValues(titleInputSelectors.join(), transformationRules);
}
