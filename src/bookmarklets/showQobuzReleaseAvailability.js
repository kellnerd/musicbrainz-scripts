/**
 * - Shows all countries in which the currently visited Qobuz release is available.
 */

/**
 * All countries in which Qobuz is currently available:
 * https://help.qobuz.com/hc/en-us/articles/360010260660-Where-is-Qobuz-available-
 */
const allCountryCodes = [
	"AT",
	"AU",
	"BE",
	"CH",
	"DE",
	"DK",
	"ES",
	"FI",
	"FR",
	"GB",
	"IE",
	"IT",
	"LU",
	"NL",
	"NO",
	"NZ",
	"SE",
	"US",
];

function getAvailableCountriesOfCurrentPage() {
	// obtain alternate pages for different languages and countries
	const languageCodes = Array.from(document.querySelectorAll('head > link[rel=alternate]'))
		.map((/** @type {HTMLLinkElement} */ link) => link.hreflang);

	// extract the country and drop duplicates (some countries have multiple languages)
	return languageCodes
		.map((code) => code.split('-')[1])
		.filter((country, index, countries) => country && countries.indexOf(country) === index);
}

const countryCodes = getAvailableCountriesOfCurrentPage();
alert(`Available in ${countryCodes.length} countries\n${countryCodes.sort().join(', ')}`);
