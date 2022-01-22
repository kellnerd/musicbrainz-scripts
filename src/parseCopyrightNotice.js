import { preferScalar } from './array.js';
import { transform } from './transformInputValues.js';

const copyrightRE = /([©℗](?:\s*[&+]?\s*[©℗])?)(?:.+?;)?\s*(\d{4}(?:\s*[,&]\s*\d{4})*)?(?:[^,.]*\sby)?\s+/;

const legalInfoRE = /((?:(?:licen[sc]ed?\s(?:to|from)|(?:distributed|marketed)(?:\sby)?)(?:\sand)?\s)+)/;

/** @type {CreditParserOptions} */
export const parserDefaults = {
	nameRE: /.+?(?:,?\s(?:LLC|LLP|(?:Inc|Ltd)\.?))?/,
	nameSeparatorRE: /[/|](?=\s|\w{2})/,
	terminatorRE: /(?<=\.)\W|$|(?=,|\.(?:\W|$)|\sunder\s)/,
};

/**
 * Extracts all copyright and legal information from the given text.
 * @param {string} text 
 * @param {Partial<CreditParserOptions>} [customOptions]
 */
export function parseCopyrightNotice(text, customOptions = {}) {
	// provide default options
	const options = {
		...parserDefaults,
		...customOptions,
	};

	/** @type {CopyrightItem[]} */
	const copyrightInfo = [];
	const namePattern = options.nameRE.source;
	const terminatorPattern = options.terminatorRE.source;

	// standardize copyright notice
	text = transform(text, [
		[/\(C\)/gi, '©'],
		[/\(P\)/gi, '℗'],
		[/«(.+?)»/g, '$1'], // remove a-tisket's French quotes
		[/for (.+?) and (.+?) for the world outside \1/g, '/ $2'], // simplify region-specific copyrights
		[/℗\s*(under\s)/gi, '$1'], // drop confusingly used ℗ symbols
		[/(?<=℗\s*)digital remaster/gi, ''], // drop text between ℗ symbol and year
	]);

	const copyrightMatches = text.matchAll(new RegExp(
		String.raw`${copyrightRE.source}(${namePattern}(?:\s*/\s*${namePattern})*)(?:${terminatorPattern})`,
		'gm'));

	for (const match of copyrightMatches) {
		const names = match[3].split(options.nameSeparatorRE).map((name) => name.trim());
		const types = match[1].split(/[&+]|(?<=[©℗])(?=[©℗])/).map(cleanType);
		const years = match[2]?.split(/[,&]/).map((year) => year.trim());
		names.forEach((name) => {
			copyrightInfo.push({
				name,
				types,
				year: preferScalar(years),
			});
		});
	}

	const legalInfoMatches = text.matchAll(new RegExp(
		`${legalInfoRE.source}(${namePattern})(?:${terminatorPattern})`,
		'gim'));

	for (const match of legalInfoMatches) {
		const types = match[1].split(/\sand\s/).map(cleanType);
		copyrightInfo.push({
			name: match[2],
			types,
		});
	}

	return copyrightInfo;
}

/**
 * Cleans and standardizes the given free text copyright/legal type.
 * @param {string} type 
 */
function cleanType(type) {
	return transform(type.toLowerCase().trim(), [
		[/licen[sc]ed?/g, 'licensed'],
		[/(distributed|marketed)(\sby)?/, '$1 by'],
	]);
}
