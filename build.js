import { build } from './tools/build.js';

build({
	bookmarkletBasePath: 'src/bookmarklets',
	userscriptBasePath: 'src/userscripts',
	docBasePath: 'doc',
	debug: process.argv.includes('-d'),
});
