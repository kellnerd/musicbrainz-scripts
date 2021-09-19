import fs from 'fs';
import path from 'path';
import extractComments from 'extract-comments';
import { rollup } from 'rollup';
import rollupIgnore from 'rollup-plugin-ignore';
import rollupImage from '@rollup/plugin-image';
import rollupStrip from '@rollup/plugin-strip';
import UglifyJS from 'uglify-js';

async function build(debug = false) {
	// build userscripts
	const userscriptBasePath = 'src/userscripts';
	const userscriptNames = await buildUserscripts(userscriptBasePath, debug);
	// prepare bookmarklets
	const bookmarkletBasePath = 'src/bookmarklets';
	const bookmarklets = await buildBookmarklets(bookmarkletBasePath, debug);
	// prepare README file and write header
	const readmePath = 'README.md';
	const readme = fs.createWriteStream(readmePath);
	const readmeHeader = fs.readFileSync('doc/_header.md', { encoding: 'utf-8' });
	readme.write(readmeHeader);
	// write bookmarklets and their extracted documentation to the README
	for (let fileName in bookmarklets) {
		const baseName = path.basename(fileName, '.js');
		const bookmarkletPath = path.join(bookmarkletBasePath, fileName);
		readme.write(`\n## [${camelToTitleCase(baseName)}](${relevantSourceFile(fileName, bookmarkletBasePath)})\n`);
		// insert an install button if there is a userscript of the same name
		if (userscriptNames.includes(baseName)) {
			readme.write(sourceAndInstallButton(baseName));
		}
		readme.write('\n```js\n' + bookmarklets[fileName] + '\n```\n');
		readme.write(extractDocumentation(bookmarkletPath) + '\n');
	}
	readme.close();
}


/**
 * Build a userscript for each JavaScript module inside the given source directory.
 * @param {string} srcPath Source directory containing the modules.
 * @returns {Promise<string[]>} Array of userscript file names (without extension).
 */
async function buildUserscripts(srcPath, debug = false) {
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
			format: 'iife', // immediately invoked function expression (prevents naming conflicts)
			banner: generateMetadataBlock(modulePath),
		},
		plugins: [
			rollupIgnore(['cross-fetch/dist/node-polyfill.js']),
			rollupImage(),
			rollupStrip({
				functions: ['console.debug'],
			})
		],
	};
	const bundle = await rollup(rollupOptions);
	if (debug) {
		console.debug(`${modulePath} depends on:`, bundle.watchFiles);
	}
	await bundle.write(rollupOptions.output);
	await bundle.close();
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
			rollupIgnore(['cross-fetch/dist/node-polyfill.js'])
		],
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
 * Generates the metadata block for the given userscript from the JSON file of the same name.
 * @param {string} userscriptPath 
 */
function generateMetadataBlock(userscriptPath) {
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
 * Converts the name from camel case into title case.
 * @param {string} name
 */
function camelToTitleCase(name) {
	return name
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


/**
 * Converts a string into an identifier that is compatible with Markdown's heading anchors.
 * @param {string} string
 */
function slugify(string) {
	return encodeURIComponent(
		string.trim()
			.toLowerCase()
			.replace(/\s+/g, '-')
	);
}


/**
 * Generates button-like links to install a userscript and to view its source code on GitHub.
 * @param {string} baseName Name of the userscript file (without extension).
 */
function sourceAndInstallButton(baseName) {
	const sourceButtonLink = 'https://raw.github.com/jerone/UserScripts/master/_resources/Source-button.png';
	const installButtonLink = 'https://raw.github.com/jerone/UserScripts/master/_resources/Install-button.png';
	return `\n[![Source](${sourceButtonLink})](${GitHubUserJS.path(baseName)})\n` +
		`[![Install](${installButtonLink})](${GitHubUserJS.path(baseName)}?raw=1)\n`;
}


/**
 * Location of the userscripts on GitHub.
 */
const GitHubUserJS = {
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


build();
