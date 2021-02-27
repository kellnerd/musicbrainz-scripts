import fs from 'fs';
import path from 'path';
import extractComments from 'extract-comments';
import { rollup } from 'rollup';
import UglifyJS from 'uglify-js';

async function build(debug = false) {
	// prepare bookmarklets
	const bookmarkletPath = 'src/bookmarklets';
	const bookmarklets = await buildBookmarklets(bookmarkletPath, debug);
	// prepare README file and write header
	const readmePath = 'README.md';
	const readme = fs.createWriteStream(readmePath);
	const readmeHeader = fs.readFileSync('doc/_header.md', { encoding: 'utf-8' });
	readme.write(readmeHeader);
	// write bookmarklets and their extracted documentation to the README
	for (let fileName in bookmarklets) {
		const scriptPath = path.join(bookmarkletPath, fileName);
		readme.write(`\n## [${scriptName(fileName)}](${relevantSourceFile(fileName, bookmarkletPath)})\n`);
		readme.write('\n```js\n' + bookmarklets[fileName] + '\n```\n');
		readme.write(extractDocumentation(scriptPath) + '\n');
	}
	readme.close();
}


/**
 * Build a bookmarklet for each JavaScript module inside the given source directory.
 * @param {string} srcPath Source directory containing the modules.
 * @returns {Promise<{[name: string]: string}>} Object which maps script names to bookmarklets.
 */
async function buildBookmarklets(srcPath, debug = false) {
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
	if (debug) {
		console.debug(`${modulePath} depends on:`, bundle.watchFiles);
		await bundle.write(rollupOptions.output);
	}
	const { output } = await bundle.generate(rollupOptions.output);
	await bundle.close();

	/**
	 * Minify bundled code with UglifyJS.
	 * @type {UglifyJS.MinifyOptions}
	 */
	const uglifyOptions = {
		compress: {
			expression: true, // preserve completion values, needed for bookmarklets which should have no return value
			drop_console: true,
			passes: 2,
		},
		output: {
			ascii_only: true,
			quote_style: 3, // always use original quotes
		},
	};
	const minifiedBundle = UglifyJS.minify(output[0].code, uglifyOptions);
	if (minifiedBundle.error) {
		throw minifiedBundle.error;
	}

	return `javascript:${minifiedBundle.code}`;
}


/**
 * Extract the first documentation block comment from the given JavaScript module.
 * @param {string} scriptPath Path to the script file.
 * @returns {string}
 */
function extractDocumentation(scriptPath) {
	const fileContents = fs.readFileSync(scriptPath, { encoding: 'utf-8' });
	const comments = extractComments(fileContents, { first: true, line: false });
	return comments.length ? comments[0].value : '';
}


/**
 * Returns the names of all JavaScript files inside the given directory.
 * @param {string} directory Path to a directory.
 * @returns {Promise<string[]>} Array of file names including the extension.
 */
async function getScriptFiles(directory) {
	const dir = await fs.promises.opendir(directory);
	let scriptFiles = [];
	for await (const entry of dir) {
		if (entry.isFile() && path.extname(entry.name) === '.js') {
			scriptFiles.push(entry.name);
		}
	}
	return scriptFiles;
}


/**
 * Returns the name of the script for the given file by converting the file name in camel case into title case.
 * @param {string} fileName 
 */
function scriptName(fileName) {
	return path.basename(fileName, '.js')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/^./, c => c.toUpperCase());
}


/**
 * Returns the path to the relevant source code file for the given script.
 * This is the module of the same name inside the source directory if it exists, otherwise it is the file itself.
 * @param {string} fileName File name of the script.
 * @param {string} basePath Base path of the script file which is used as fallback.
 */
function relevantSourceFile(fileName, basePath) {
	const srcPath = path.posix.join('src', fileName);
	return fs.existsSync(srcPath) ? srcPath : path.posix.join(basePath, fileName);
}


/**
 * Creates an object from the given arrays of keys and corresponding values.
 * @param {string[]} keys 
 * @param {any[]} values 
 */
function zipObject(keys, values) {
	return Object.fromEntries(keys.map((_, i) => [keys[i], values[i]]));
}


build();
