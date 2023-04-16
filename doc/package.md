## Node.js Package

Do you want to create your own userscript or bookmarklet project for MusicBrainz without having to rewrite everything from scratch?

Have a look at my [userscript bundler](https://github.com/kellnerd/userscript-bundler) tools which are used to build the userscripts, bookmarklets and the README in this repository.

You can also reuse code from this repository by installing it as a dependency of your own Node.js project:
`npm install kellnerd/musicbrainz-scripts`

The package gives you access to all the MusicBrainz specific modules under [src](src/) except for the main modules of the bookmarklets and userscripts themselves.

The primary entry point of the `@kellnerd/musicbrainz-scripts` package is [index.js](index.js) which provides import shortcuts for stable, potentially useful pieces of code from `src/`.

- Shortcut usage: `import { buildEditNote } from '@kellnerd/musicbrainz-scripts';`

- Full specifier: `import { buildEditNote } from '@kellnerd/musicbrainz-scripts/src/editNote.js';`
