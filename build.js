import { rollup } from 'rollup';
import UglifyJS from 'uglify-js';

/**
 * Bundles and minifies the given module into a bookmarklet.
 * @param {string} modulePath Path to the executable module of the bookmarklet.
 * @returns {Promise<string>} Bookmarklet code as a `javascript:` URI.
 */
async function buildBookmarklet(modulePath) {
	/**
	 * Bundle all used modules into an IIFE (immediately invoked function expression) with rollup.
	 * @type {import('rollup').RollupOptions} 
	 */
	const rollupOptions = {
		input: modulePath,
		output: {
			dir: 'dist/bookmarklets',
			format: 'iife',
			strict: false,
		},
	};
	const bundle = await rollup(rollupOptions);
	// console.debug(bundle.watchFiles); // an array of file names this bundle depends on
	const { output } = await bundle.generate(rollupOptions.output);

	/**
	 * Minify bundled code with UglifyJS.
	 * @type {UglifyJS.MinifyOptions}
	 */
	const uglifyOptions = {
		compress: {
			expression: true, // preserve completion values from terminal statements without return, e.g. in bookmarklets
			drop_console: true,
			passes: 2,
		},
		output: {
			ascii_only: true,
			quote_style: 1, // always use original quotes
		},
	};
	const minifiedBundle = UglifyJS.minify(output[0].code, uglifyOptions);
	if (minifiedBundle.error) {
		throw minifiedBundle.error;
	}
	const bookmarklet = `javascript:${minifiedBundle.code}`;
	console.log(bookmarklet);

	await bundle.write(rollupOptions.output); // for debugging only
	await bundle.close();
	return bookmarklet;
}


if (process.argv.length < 3) {
	process.exit(1)
};

buildBookmarklet(process.argv[2]);
