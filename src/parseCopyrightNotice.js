import { transform } from './transformInputValues.js';

const labelNamePattern = /(.+?(?:,?\s(?:LLC|LLP|(?:Inc|Ltd)\.?))?)(?:(?<=\.)|$|(?=,|\.|\sunder\s))/;

const copyrightPattern = new RegExp(
	/([©℗](?:\s*[&+]?\s*[©℗])?)(?:.+?;)?\s*(\d{4})?\s+/.source + labelNamePattern.source, 'gm');

const legalInfoPattern = new RegExp(
	/(licen[sc]ed?\s(?:to|from)|(?:distributed|marketed)\sby)\s/.source + labelNamePattern.source, 'gim');

/**
 * Extracts all copyright and legal information from the given text.
 * @param {string} text 
 */
export function parseCopyrightNotice(text) {
	/** @type {CopyrightItem[]} */
	const copyrightInfo = [];

	// standardize copyright notice
	text = transform(text, [
		[/\(C\)/gi, '©'],
		[/\(P\)/gi, '℗'],
		[/«(.+?)»/g, '$1'], // remove a-tisket's French quotes
		[/for (.+?) and (.+?) for the world outside \1/g, '/ $2'], // simplify region-specific copyrights
		[/℗\s*(under\s)/gi, '$1'], // drop confusingly used ℗ symbols
	]);

	const copyrightMatches = text.matchAll(copyrightPattern);
	for (const match of copyrightMatches) {
		const names = match[3].split(/\/(?=\s|\w{2})/g).map((name) => name.trim());
		const types = match[1].split(/[&+]|(?<=[©℗])(?=[©℗])/).map(cleanType);
		names.forEach((name) => {
			copyrightInfo.push({
				name,
				types,
				year: match[2],
			});
		});
	}

	const legalInfoMatches = text.matchAll(legalInfoPattern);
	for (const match of legalInfoMatches) {
		copyrightInfo.push({
			name: match[2],
			types: [cleanType(match[1])],
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
	]);
}

/**
 * @typedef {Object} CopyrightItem
 * @property {string} name Name of the copyright owner (label or artist).
 * @property {string[]} types Types of copyright or legal information, will be mapped to relationship types.
 * @property {string} [year] Numeric year, has to be a string with four digits, otherwise MBS complains.
 */
