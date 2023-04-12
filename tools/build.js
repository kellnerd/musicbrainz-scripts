import fs from 'fs';
import path from 'path';

import { buildBookmarklets } from './buildBookmarklets.js';
import { buildUserscripts } from './buildUserscripts.js';
import { extractDocumentation } from './extractDocumentation.js';
import { getMarkdownFiles } from './getFiles.js'
import { sourceAndInstallButton } from './github.js';
import { loadMetadata } from './userscriptMetadata.js';
import { camelToTitleCase } from '../utils/string/casingStyle.js';

export async function build({
	bookmarkletBasePath = 'src/bookmarklets',
	userscriptBasePath = 'src/userscripts',
	readmePath = 'README.md',
	docBasePath = 'doc',
	debug = false,
} = {}) {
	// build userscripts
	const userscriptNames = await buildUserscripts(userscriptBasePath, debug);

	// prepare bookmarklets
	const bookmarklets = await buildBookmarklets(bookmarkletBasePath, debug);

	// prepare README file and write header
	const readme = fs.createWriteStream(readmePath);
	const readmeHeader = fs.readFileSync(path.join(docBasePath, '_header.md'), { encoding: 'utf-8' });
	readme.write(readmeHeader);

	// write userscripts and their extracted documentation to the README
	readme.write('\n## Userscripts\n');

	for (let baseName of userscriptNames) {
		const filePath = path.join(userscriptBasePath, baseName + '.user.js');
		const metadata = await loadMetadata(filePath);

		readme.write(`\n### ${camelToTitleCase(baseName)}\n`);
		readme.write('\n' + metadata.description + '\n');
		metadata.features?.forEach((item) => readme.write(`- ${item}\n`));
		readme.write(sourceAndInstallButton(baseName));

		// also insert the code snippet if there is a bookmarklet of the same name
		const bookmarkletFileName = baseName + '.js';
		if (bookmarkletFileName in bookmarklets) {
			const bookmarkletPath = path.join(bookmarkletBasePath, bookmarkletFileName);

			readme.write('\nAlso available as a bookmarklet with less features:\n');
			readme.write(extractDocumentation(bookmarkletPath) + '\n');
			readme.write('\n```js\n' + bookmarklets[bookmarkletFileName] + '\n```\n');

			delete bookmarklets[bookmarkletFileName];
		}
	}

	// write remaining bookmarklets and their extracted documentation to the README
	readme.write('\n## Bookmarklets\n');

	for (let fileName in bookmarklets) {
		const baseName = path.basename(fileName, '.js');
		const bookmarkletPath = path.join(bookmarkletBasePath, fileName);

		readme.write(`\n### [${camelToTitleCase(baseName)}](${relevantSourceFile(fileName, bookmarkletBasePath)})\n`);

		readme.write(extractDocumentation(bookmarkletPath) + '\n');
		readme.write('\n```js\n' + bookmarklets[fileName] + '\n```\n');
	}

	// append all additional documentation files to the README
	const docs = await getMarkdownFiles(docBasePath);

	docs.map((file) => path.join(docBasePath, file)).forEach((filePath) => {
		const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
		readme.write('\n' + content);
	});

	readme.close();
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
