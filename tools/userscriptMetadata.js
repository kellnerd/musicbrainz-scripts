import path from 'path';
import { pathToFileURL } from 'url';

import { GITHUB } from './github.js';
import { preferArray } from '../utils/array/scalar.js';

/** @type {Array<keyof UserscriptMetadata>} */
const metadataOrder = [
	'name',
	'version',
	'namespace',
	'author',
	'description',
	'icon',
	'homepageURL',
	'downloadURL',
	'updateURL',
	'supportURL',
	'require',
	'resource',
	'grant',
	'run-at',
	'inject-into',
	'match',
	'include',
	'exclude-match',
	'exclude',
];

/**
 * Generates the metadata block for the given userscript from the corresponding .meta.js ES module.
 * @param {string} userscriptPath
 */
export async function generateMetadataBlock(userscriptPath) {
	const baseName = path.basename(userscriptPath, '.user.js');
	const date = new Date(); // current date will be used as version identifier
	const maxKeyLength = Math.max(...metadataOrder.map((key) => key.length));

	/** @type {UserscriptDefaultMetadata} */
	const defaultMetadata = {
		author: GITHUB.owner,
		namespace: GITHUB.repoUrl,
		homepageURL: GITHUB.readmeUrl(baseName),
		downloadURL: GITHUB.userscriptRawUrl(baseName),
		updateURL: GITHUB.userscriptRawUrl(baseName),
		supportURL: GITHUB.supportUrl,
	};

	/** @type {UserscriptMetadata} */
	const metadata = {
		...defaultMetadata,
		version: [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('.'),
		grant: 'none',
		...await loadMetadata(userscriptPath),
	};

	const metadataBlock = metadataOrder.flatMap((key) => {
		return preferArray(metadata[key])
			.filter((value) => value)
			.map((value) => `// @${key.padEnd(maxKeyLength)} ${value}`);
	});

	metadataBlock.unshift('// ==UserScript==');
	metadataBlock.push('// ==/UserScript==\n');

	return metadataBlock.join('\n');
}

/**
 * Loads the metadata for the given userscript from the .meta.js ES module of the same name.
 * @param {string} userscriptPath
 * @returns {Promise<UserscriptMetadata>}
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
