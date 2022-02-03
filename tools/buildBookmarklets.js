import path from 'path';
import { rollup } from 'rollup';
import rollupIgnore from 'rollup-plugin-ignore';
import { minify } from 'terser';

import { getScriptFiles } from './getFiles.js';
import { zipObject } from '../utils/object/zipObject.js';

/**
 * Builds a bookmarklet for each JavaScript module inside the given source directory.
 * @param {string} srcPath Source directory containing the modules.
 * @returns {Promise<{[name: string]: string}>} Object which maps script names to bookmarklets.
 */
export async function buildBookmarklets(srcPath, debug = false) {
	const scriptFiles = await getScriptFiles(srcPath);
	const bookmarklets = await Promise.all(scriptFiles
		.map((file) => path.join(srcPath, file))
		.map((modulePath) => buildBookmarklet(modulePath, debug))
	);

	return zipObject(scriptFiles, bookmarklets);
}


/**
 * Bundles and minifies the given module into a bookmarklet.
 * @param {string} modulePath Path to the executable module of the bookmarklet.
 * @returns {Promise<string>} Bookmarklet code as a `javascript:` URI.
 */
async function buildBookmarklet(modulePath, debug = false) {
	/**
	 * Bundle all used modules into an IIFE with rollup.
	 * @type {import('rollup').RollupOptions}
	 */
	const rollupOptions = {
		input: modulePath,
		output: {
			dir: 'dist/bookmarklets',
			format: 'iife',
			strict: false,
		},
		plugins: [
			rollupIgnore(['cross-fetch/dist/node-polyfill.js']),
		],
	};

	const bundle = await rollup(rollupOptions);

	if (debug) {
		console.debug(`${modulePath} depends on:`, bundle.watchFiles);
		await bundle.write(rollupOptions.output);
	}

	const { output } = await bundle.generate(rollupOptions.output);
	await bundle.close();

	// minify bundled code with terser
	const minifiedBundle = await minify({
		modulePath: output[0].code,
	}, {
		compress: {
			expression: true,
			drop_console: true,
			passes: 2,
		},
		output: {
			ascii_only: true,
			quote_style: 3,
		},
	});

	return `javascript:${minifiedBundle.code}`;
}
