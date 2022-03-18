import fs from 'fs';
import path from 'path';

/**
 * Returns the names of all Markdown files inside the given directory.
 * Excludes files whose names start with an underscore.
 * @param {string} directory Path to a directory.
 * @returns {Promise<string[]>} Array of file names including the extension.
 */
export async function getMarkdownFiles(directory) {
	const dir = await fs.promises.opendir(directory);
	let mdFiles = [];

	for await (const entry of dir) {
		if (entry.isFile() && !entry.name.startsWith('_') && path.extname(entry.name) === '.md') {
			mdFiles.push(entry.name);
		}
	}

	return mdFiles;
}


/**
 * Returns the names of all JavaScript files inside the given directory.
 * @param {string} directory Path to a directory.
 * @param {string} [extension] Required extension of the files, defaults to `.js`.
 * @returns {Promise<string[]>} Array of file names including the extension.
 */
export async function getScriptFiles(directory, extension = '.js') {
	const dir = await fs.promises.opendir(directory);
	let scriptFiles = [];

	for await (const entry of dir) {
		if (entry.isFile() && entry.name.endsWith(extension)) {
			scriptFiles.push(entry.name);
		}
	}

	return scriptFiles;
}
