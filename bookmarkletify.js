const UglifyJS = require('uglify-js');
const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
	process.exit(1)
};

const codeFile = process.argv[2];
const scriptName = path.basename(codeFile, '.js');

try {
	const code = fs.readFileSync(codeFile, { encoding: 'utf-8' });
	const result = UglifyJS.minify(`(()=>{${scriptName}();${code}})()`, {
		compress: {
			expression: true, // preserve completion values from terminal statements without return, e.g. in bookmarklets
			drop_console: true,
		},
		output: {
			ascii_only: true,
			quote_style: 1, // always use single quotes
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
