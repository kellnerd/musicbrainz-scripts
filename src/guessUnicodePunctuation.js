function guessUnicodePunctuation() {
	const titleInputSelectors = [
		'input#name', // release title (release editor)
		'input.track-name', // all track titles (release editor)
		'#id-edit-recording\\.name', // recording name (recording editor)
		'#id-edit-work\\.name', // work name (work editor)
	];
	let transformationRules = [
		[/(?<!\S)"(.+?)"(?!\S)/g, '“$1”'], // double quotes
		[/(?<!\S)'(.+?)'(?!\S)/g, '‘$1’'], // single quotes
		// ... which are not following / followed by non-whitespace characters
		[/(\d+)"/g, '$1″'], // double primes, e.g. for 12″
		[/(\d+)'(\d+)/g, '$1′$2'], // single primes, e.g. for 3′42″ but not for 70’s
		[/'/g, '’'], // ... and finally the apostrophes should be remaining
		[/(?<!\.)\.{3}(?!\.)/g, '…'], // horizontal ellipsis (but not more than three dots)
		[/ - /g, ' – '], // en dash
		[/(\d+)-(\d+)/g, '$1–$2'], // en dash for spans where it means "to", e.g. 1965–1972
		[/-/g, '‐'], // hyphen
		// difficult to find rules for: em dash (rare), minus (very rare), figure dash (very rare)
		// TODO: localize quotes using release/lyrics language
	];

	$(titleInputSelectors.join()).each((_index, input) => {
		let value = input.value;
		$(input).css('background-color', '');
		transformationRules.forEach(([searchValue, newValue]) => {
			value = value.replace(searchValue, newValue);
			console.debug(value);
		});
		if (value != input.value) {
			$(input).val(value).trigger('change').css('background-color', 'yellow');
		}
	});
}
