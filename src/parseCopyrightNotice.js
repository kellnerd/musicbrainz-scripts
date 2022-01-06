import { transform } from './transformInputValues.js';

const labelNamePattern = /(.+?(?:, (?:LLP|Inc\.?))?)(?=,|\.| under |$)/;

const copyrightPattern = new RegExp(
	/([©℗](?:\s*[&+]?\s*[©℗])?)(?:.+?;)?\s*(\d{4})?\s+/.source + labelNamePattern.source, 'g');

const legalInfoPattern = new RegExp(
	/(licen[sc]ed? (?:to|from)|(?:distributed|marketed) by)\s+/.source + labelNamePattern.source, 'gi');

/**
 * Extracts all copyright data and legal information from the given text.
 * @param {string} text 
 */
export function parseCopyrightNotice(text) {
	/** @type {CopyrightData[]} */
	const results = [];

	// standardize copyright notice
	text = transform(text, [
		[/\(C\)/gi, '©'],
		[/\(P\)/gi, '℗'],
		[/«(.+?)»/g, '$1'], // remove a-tisket's French quotes
	]);

	const copyrightMatches = text.matchAll(copyrightPattern);
	for (const match of copyrightMatches) {
		const names = match[3].split(/\/(?=\w{2})/g).map((name) => name.trim());
		const types = match[1].split(/[&+]|(?<=[©℗])(?=[©℗])/).map(cleanType);
		names.forEach((name) => {
			results.push({
				name,
				types,
				year: match[2],
			});
		});
	}

	const legalInfoMatches = text.matchAll(legalInfoPattern);
	for (const match of legalInfoMatches) {
		results.push({
			name: match[2],
			types: [cleanType(match[1])],
		});
	}

	return results;
}

/**
 * Cleans and standardizes the given free text type.
 * @param {string} type 
 */
function cleanType(type) {
	return transform(type.toLowerCase().trim(), [
		[/licen[sc]ed?/g, 'licensed'],
	]);
}

/**
 * @typedef {Object} CopyrightData
 * @property {string} name Name of the copyright owner (label or artist).
 * @property {string[]} types Types of copyright or legal information, will be mapped to relationship types.
 * @property {string} [year] Numeric year, has to be a string with four digits, otherwise MBS complains.
 */
