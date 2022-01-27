import fs from 'fs';
import path from 'path';

import { GitHubUserJS } from './github.js';
import { camelToTitleCase } from '../utils/string/casingStyle.js';

/**
 * Generates the metadata block for the given userscript from the JSON file of the same name.
 * @param {string} userscriptPath
 */
export function generateMetadataBlock(userscriptPath) {
	const metadataPath = userscriptPath.replace(/\.user\.js$/, '.json');
	const baseName = path.basename(metadataPath, '.json');
	const date = new Date(); // current date will be used as version identifier

	const metadata = JSON.parse(fs.readFileSync(metadataPath, { encoding: 'utf-8' }));
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
	addProperty('namespace', GitHubUserJS.repoUrl());
	parse('author');
	parse('description');
	parse('icon');
	addProperty('homepageURL', GitHubUserJS.readmeUrl(baseName));
	addProperty('downloadURL', GitHubUserJS.rawUrl(baseName));
	addProperty('updateURL', GitHubUserJS.rawUrl(baseName));
	parse('supportURL', GitHubUserJS.supportUrl());
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
