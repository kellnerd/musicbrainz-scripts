import 'cross-fetch/dist/node-polyfill.js';

/**
 * Rules to convert basic Markdown syntax into MusicBrainz annotation markup.
 */
export const markdownToAnnotation = [
	// convert links & preserve URLs from being altered
	[/\[(.+?)\]\((.+?)\)/g, '[$2|$1]'], // labeled link
	[/(?<!\[)(https?:\/\/\S+)/g, '[$1]'], // plain text HTTP(S) link
	[/\[(.+?)(\|.+?)?\]/g, (_match, url, label = '') => `[${btoa(url)}${label}]`], // Base64 encode URLs
	// inline markup
	[/(__|\*\*)(?=\S)(.+?)(?<=\S)\1/g, "'''$2'''"], // bold
	[/(_|\*)(?=\S)(.+?)(?<=\S)\1/g, "''$2''"], // italic
	// block markup (match start/end of lines in multiline mode)
	[/^\# +(.+?)( +\#*)?$/gm, '= $1 ='], // atx heading, level 1
	[/^\#{2} +(.+?)( +\#*)?$/gm, '== $1 =='], // atx heading, level 2
	[/^\#{3} +(.+?)( +\#*)?$/gm, '=== $1 ==='], // atx heading, level 3
	[/^(\d+)\. +/gm, '    $1. '], // ordered list items, level 1
	[/^[-+*] +/gm, '    * '], // unordered list items, level 1
	// restore URLs (decode Base64)
	[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g, (_match, url, label = '') => `[${atob(url)}${label}]`],
];

/**
 * Converts all absolute URLs to MusicBrainz entities to labeled entity links for the given annotation.
 * @param {string} annotationText 
 * @returns {Promise<string>}
 */
export function convertEntityLinks(annotationText) {
	return replaceAsync(annotationText, /\[(.+?)(?:\|(.+?))?\]/g, (_match, url, label) => createEntityLink(url, label));
}

/**
 * Creates an entity link for use in annotations. Its label will be the name of the entity if it is not given.
 * @param {string} urlString URL to a MusicBrainz entity.
 * @param {string?} label Text label that should be rendered for the link (optional).
 * @returns {Promise<string>} `[entity-type:mbid|label]`
 */
async function createEntityLink(urlString, label = null) {
	const baseUrl = 'musicbrainz.org';
	if (urlString.includes(baseUrl)) {
		const url = new URL(urlString);
		const [match, entityType, mbid] = url.pathname.match(/^\/(.+?)\/([0-9a-f-]{36})$/) || [];
		if (match) {
			if (!label) {
				label = await fetchEntityName(url);
			}
			return `[${entityType}:${mbid}|${label}]`;
		}
	}
	return createLink(urlString, label);
}

/**
 * Queries the MusicBrainz API to get the name/title of the entity.
 * @param {URL} url URL to a MusicBrainz entity.
 * @returns {Promise<string>}
 */
async function fetchEntityName(url) {
	url.pathname = '/ws/2' + url.pathname;
	url.search = '?fmt=json';
	let response = await fetch(url);
	response = await response.json();
	return response.name || response.title;
}

/**
 * Replaces text in a string, using a regular expression and with support for asynchronous replacement functions.
 * Taken from https://stackoverflow.com/a/48032528.
 * @param {string} string The input string.
 * @param {RegExp} regex A string to search for.
 * @param {(match: string, ...args) => Promise<string>} asyncFunction A function that returns the replacement text.
 * @returns {Promise<string>}
 */
async function replaceAsync(string, regex, asyncFunction) {
	const promises = [];
	string.replace(regex, (match, ...args) => {
		const promise = asyncFunction(match, ...args);
		promises.push(promise);
	});
	const data = await Promise.all(promises);
	return string.replace(regex, () => data.shift());
}

/**
 * Creates a bracketed link for use in annotations.
 * @param {string} urlString 
 * @param {*} label Text label that should be rendered for the link (optional).
 * @returns {string}
 */
function createLink(urlString, label = null) {
	if (label) {
		return `[${urlString}|${label}]`;
	} else {
		return `[${urlString}]`;
	}
}
