import { build } from '@kellnerd/userscript-bundler';

build({
	bookmarkletSourcePath: 'src/bookmarklets',
	userscriptSourcePath: 'src/userscripts',
	userscriptNameFormatter: ({ metadata }) => metadata.name.replace(/^MusicBrainz: /, ''),
	docSourcePath: 'doc',
	debug: process.argv.includes('-d'),
});
