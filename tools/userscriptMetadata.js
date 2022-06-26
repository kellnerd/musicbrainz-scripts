import path from 'path';
import { pathToFileURL } from 'url';

import { GITHUB } from './github.js';
import { camelToTitleCase } from '../utils/string/casingStyle.js';

/**
 * Generates the metadata block for the given userscript from the corresponding .meta.js ES module.
 * @param {string} userscriptPath
 */
export async function generateMetadataBlock(userscriptPath) {
	const baseName = path.basename(userscriptPath, '.user.js');
	const date = new Date(); // current date will be used as version identifier

	const metadata = await loadMetadata(userscriptPath);
	const metadataBlock = ['// ==UserScript=='];

	function addProperty(key, value) {
		metadataBlock.push(`// @${key.padEnd(12)} ${value}`);
	}

	function parse(key, fallback = undefined) {
		const value = metadata[key] || fallback;
		if (value) {
			if (Array.isArray(value)) {
				value.forEach((value) => addProperty(key, value));
			} else {
				addProperty(key, value);
			}
		}
	}

	parse('name', camelToTitleCase(baseName));
	addProperty('version', [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('.'));
	addProperty('namespace', GITHUB.repoUrl);
	parse('author');
	parse('description');
	parse('icon');
	addProperty('homepageURL', GITHUB.readmeUrl(baseName));
	addProperty('downloadURL', GITHUB.userscriptRawUrl(baseName));
	addProperty('updateURL', GITHUB.userscriptRawUrl(baseName));
	parse('supportURL', GITHUB.supportUrl);
	parse('require');
	parse('resource');
	parse('grant', 'none');
	parse('run-at');
	parse('inject-into');
	parse('match');
	parse('include');
	parse('exclude');

	metadataBlock.push('// ==/UserScript==\n');

	return metadataBlock.join('\n');
}

/**
 * Loads the metadata for the given userscript from the .meta.js ES module of the same name.
 * @param {string} userscriptPath
 */
export async function loadMetadata(userscriptPath) {
	const metadataPath = userscriptPath.replace(/\.user\.js$/, '.meta.js');
	const metadataModule = await import(pathToFileURL(metadataPath));

	return metadataModule.default;
}

/**
 * Creates a regular expression that matches a full HTTP or HTTPS URL.
 * @param {string} domainAndPathRegex Regular expression that matches domain and path.
 */
export function createURLRuleRegex(domainAndPathRegex, {
	allowQuery = true,
	allowFragment = true,
} = {}) {
	let ruleRegex = '/^https?://' + domainAndPathRegex;

	if (allowQuery) {
		ruleRegex += String.raw`(\?.+?)?`;
	}
	if (allowFragment) {
		ruleRegex += '(#.+?)?';
	}

	return ruleRegex + '$/';
}

/**
 * Creates a regular expression that matches a MusicBrainz URL.
 * @param {string} pathRegex Regular expression that matches a path on musicbrainz.org.
 */
export function createMusicBrainzURLRule(pathRegex) {
	return createURLRuleRegex(String.raw`((beta|test)\.)?musicbrainz\.org/` + pathRegex);
}
