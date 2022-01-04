import { opendir } from 'fs/promises';
import {
	dirname,
	join as joinPath,
} from 'path';
import {
	fileURLToPath,
	pathToFileURL,
} from 'url';

/**
 * Runs all test modules inside the given directory.
 * @param {string} basePath Path to the test directory. 
 * @returns {number} The total number of failed test cases.
 */
async function runAllTests(basePath) {
	const testDir = await opendir(basePath);
	let totalFailures = 0;

	for await (const entry of testDir) {
		if (entry.isFile() && entry.name.endsWith('.test.js')) {
			const modulePath = joinPath(basePath, entry.name);
			const module = await import(pathToFileURL(modulePath));
			console.info('\nRunning', entry.name);
			totalFailures += module.default();
		}
	}

	return totalFailures;
}

const thisDirectory = dirname(fileURLToPath(import.meta.url));
runAllTests(thisDirectory).then((failures) => process.exit(failures));
