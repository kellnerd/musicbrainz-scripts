## Development

Running `npm run build` compiles [all userscripts](src/userscripts/) and [all bookmarklets](src/bookmarklets/) before it generates an updated version of `README.md`. Before you can run this command you have to ensure that you have setup [Node.js](https://nodejs.org/) and have installed the dependencies of the build script via `npm install`.

If you want to compile a single minified bookmarklet from a module or a standalone JavaScript file you can run `node tools/bookmarkletify.js file.js`. The result will be output directly on screen and no files will be modified.
