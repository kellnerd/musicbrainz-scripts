import { searchEntity } from './internalAPI.js';
import {
	closingDialog,
	createAddRelationshipDialog,
	openDialogAndTriggerAutocomplete,
} from './relationshipEditor.js';
import { transform } from './transformInputValues.js';

/** MBS relationship link type IDs (incomplete). */
const LINK_TYPES = {
	release: {
		label: {
			'©': 708,
			'℗': 711,
			'licensed from': 712,
			'licensed to': 833,
			'distributed by': 361,
			'marketed by': 848,
		},
	},
};

const labelNamePattern = /([^.,]+(?:, (?:LLP|Inc\.?))?)/;

const copyrightPattern = new RegExp(
	/(℗\s*[&+]\s*©|[©℗])\s*(\d+)?\s+/.source + labelNamePattern.source, 'g');

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
		const types = match[1].split(/[&+]/).map(cleanType);
		results.push({
			name: match[3],
			types,
			year: match[2],
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
 * Creates and fills an "Add relationship" dialog for each piece of copyright information.
 * Lets the user choose the appropriate target label and waits for the dialog to close before continuing with the next one.
 * Automatically chooses the first search result and accepts the dialog in automatic mode.
 * @param {CopyrightData[]} data List of copyright information.
 * @param {boolean} [automaticMode] Automatic mode, disabled by default.
 */
export async function addCopyrightRelationships(data, automaticMode = false) {
	for (const entry of data) {
		const entityType = 'label';
		const relTypes = LINK_TYPES.release[entityType];
		const targetEntity = MB.entity(automaticMode
			? (await searchEntity(entityType, entry.name))[0] // use the first result
			: { name: entry.name, entityType }
		);
		for (const type of entry.types) {
			const dialog = createAddRelationshipDialog(targetEntity);
			const rel = dialog.relationship();
			rel.linkTypeID(relTypes[type]);
			rel.entity0_credit(entry.name);
			if (entry.year) {
				rel.begin_date.year(entry.year);
				rel.end_date.year(entry.year);
			}

			if (automaticMode) {
				dialog.accept();
			} else {
				openDialogAndTriggerAutocomplete(dialog);
				await closingDialog(dialog);
			}
		}
	}
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
