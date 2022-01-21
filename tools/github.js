import {
	camelToTitleCase,
	slugify,
} from '../utils/string/casingStyle.js';

/**
 * Generates button-like links to install a userscript and to view its source code on GitHub.
 * @param {string} baseName Name of the userscript file (without extension).
 */
export function sourceAndInstallButton(baseName) {
	const sourceButtonLink = 'https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github';
	const installButtonLink = 'https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey';
	return `\n[![Install](${installButtonLink})](${GitHubUserJS.path(baseName)}?raw=1)\n` +
		`[![Source](${sourceButtonLink})](${GitHubUserJS.path(baseName)})\n`;
}

/**
 * Location of the userscripts on GitHub.
 */
export const GitHubUserJS = {
	repository: 'kellnerd/musicbrainz-bookmarklets',
	branch: 'main',
	basePath: 'dist',
	repoUrl: function () {
		return `https://github.com/${this.repository}`;
	},
	path: function (baseName) {
		return `${this.basePath}/${baseName}.user.js`;
	},
	rawUrl: function (baseName) {
		return `https://raw.githubusercontent.com/${this.repository}/${this.branch}/${this.path(baseName)}`;
	},
	readmeUrl: function (baseName) {
		return `${this.repoUrl()}#${slugify(camelToTitleCase(baseName))}`;
	},
	supportUrl: function () {
		return `${this.repoUrl()}/issues`;
	}
};
