import fs from 'fs';
import extractComments from 'extract-comments';

/**
 * Extract the first documentation block comment from the given JavaScript module.
 * @param {string} scriptPath Path to the script file.
 * @returns {string}
 */
export function extractDocumentation(scriptPath) {
	const fileContents = fs.readFileSync(scriptPath, { encoding: 'utf-8' });
	const comments = extractComments(fileContents, { first: true, line: false });
	return comments.length ? comments[0].value : '';
}
