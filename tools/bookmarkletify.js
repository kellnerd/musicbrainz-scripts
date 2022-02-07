import { buildBookmarklet } from './buildBookmarklets.js';

if (process.argv.length < 3) {
	process.exit(1);
};

const modulePath = process.argv[2];
buildBookmarklet(modulePath).then(console.log);
