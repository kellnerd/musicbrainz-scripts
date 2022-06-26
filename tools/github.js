import { readFileSync } from 'fs';
import {
	camelToTitleCase,
	slugify,
} from '../utils/string/casingStyle.js';

// Inspired by https://github.com/ROpdebee/mb-userscripts/blob/841fa757a21d53a2ce714c7868ffb98116c15ffb/build/plugin-userscript.ts
class GitRepo {
	defaultBranch = 'main';
	distributionPath = 'dist';

	/** @param {URL} repoUrl */
	constructor(repoUrl) {
		const [owner, repoName] = repoUrl.pathname.match(/^\/([^/]+)\/([^/]+?)(?:\.git|$)/)?.slice(1) ?? [];
		if (!owner || !repoName) throw new Error(`Malformed git repo URL ${repoUrl}`);

		this.host = repoUrl.host
		this.owner = owner;
		this.repoName = repoName;
	}

	get repoUrl() {
		return `https://${this.host}/${this.owner}/${this.repoName}`;
	}

	get supportUrl() {
		return `${this.repoUrl}/issues`;
	}

	static fromPackageMetadata(packageJsonPath = '../package.json') {
		const packageUrl = new URL(packageJsonPath, import.meta.url);
		/** @type {typeof import('../package.json')} */
		const metadata = JSON.parse(readFileSync(packageUrl));
		const repoUrl = new URL(metadata.repository.url);
		return new GitRepo(repoUrl);
	}

	/**
	 * Generates a link to the README section which corresponds to the given name.
	 * @param {string} baseName Name of the section, can be the script's name in camel case.
	 */
	readmeUrl(baseName) {
		return `${this.repoUrl}#${slugify(camelToTitleCase(baseName))}`;
	}

	/**
	 * Generates the path for the given userscript.
	 * @param {string} baseName
	 */
	userscriptPath(baseName) {
		return `${this.distributionPath}/${baseName}.user.js`;
	}

	/**
	 * Generates the raw URL for the given userscript.
	 * @param {string} baseName
	 */
	userscriptRawUrl(baseName) {
		return 'https://raw.' + [this.host, this.owner, this.repoName, this.defaultBranch, this.userscriptPath(baseName)].join('/');
	}
}

export const GITHUB = GitRepo.fromPackageMetadata();

/**
 * Generates button-like links to install a userscript and to view its source code on GitHub.
 * @param {string} baseName Name of the userscript file (without extension).
 */
export function sourceAndInstallButton(baseName) {
	const sourceButtonLink = 'https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github';
	const installButtonLink = 'https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey';
	return `\n[![Install](${installButtonLink})](${GITHUB.userscriptPath(baseName)}?raw=1)\n` +
		`[![Source](${sourceButtonLink})](${GITHUB.userscriptPath(baseName)})\n`;
}
