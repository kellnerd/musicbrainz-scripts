import { build } from '@kellnerd/userscript-bundler';

build({
	bookmarkletBasePath: 'src/bookmarklets',
	userscriptBasePath: 'src/userscripts',
	docBasePath: 'doc',
	debug: process.argv.includes('-d'),
});
