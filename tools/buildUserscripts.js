import path from 'path';
import { rollup } from 'rollup';
import rollupIgnore from 'rollup-plugin-ignore';
import rollupImage from '@rollup/plugin-image';
import rollupStrip from '@rollup/plugin-strip';

import { getScriptFiles } from './getFiles.js';
import { generateMetadataBlock } from './userscriptMetadata.js';

/**
 * Build a userscript for each JavaScript module inside the given source directory.
 * @param {string} srcPath Source directory containing the modules.
 * @returns {Promise<string[]>} Array of userscript file names (without extension).
 */
export async function buildUserscripts(srcPath, debug = false) {
	const scriptFiles = await getScriptFiles(srcPath);
	scriptFiles
		.map((file) => path.join(srcPath, file))
		.forEach((modulePath) => buildUserscript(modulePath, debug));

	return scriptFiles.map((file) => path.basename(file, '.user.js'));
}


/**
 * Bundles the given module into a userscript.
 * @param {string} modulePath Path to the executable module of the userscript.
 */
async function buildUserscript(modulePath, debug = false) {
	/**
	 * Bundle all used modules with rollup and prepend the generated metadata block.
	 * @type {import('rollup').RollupOptions}
	 */
	const rollupOptions = {
		input: modulePath,
		output: {
			dir: 'dist',
			format: 'iife',
			banner: generateMetadataBlock(modulePath),
		},
		plugins: [
			rollupIgnore(['cross-fetch/dist/node-polyfill.js']),
			rollupImage(),
			rollupStrip({
				functions: ['console.debug'],
			}),
		],
	};

	const bundle = await rollup(rollupOptions);

	if (debug) {
		console.debug(`${modulePath} depends on:`, bundle.watchFiles);
	}

	await bundle.write(rollupOptions.output);
	await bundle.close();
}
