import UglifyJS from 'uglify-js';
import { readFileSync } from 'fs';

if (process.argv.length < 3) {
	process.exit(1)
};

const codeFile = process.argv[2];

try {
	const code = readFileSync(codeFile, { encoding: 'utf-8' });
	const result = UglifyJS.minify(code, {
		compress: {
			expression: true, // preserve completion values from terminal statements without return, e.g. in bookmarklets
			drop_console: true,
			passes: 2,
		},
		output: {
			ascii_only: true,
			quote_style: 3, // always use original quotes
		}
	});
	if (result.error) {
		console.error(result.error);
	} else {
		const bookmarklet = `javascript:${result.code}`;
		console.log(bookmarklet);
	}
} catch (error) {
	console.error(error.message);
}
