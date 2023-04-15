## Node.js Package

Do you want to create your own userscript or bookmarklet project for MusicBrainz without having to rewrite everything from scratch?

You can reuse code from this repository by installing it as a dependency of your own Node.js project:
`npm install kellnerd/musicbrainz-scripts`

The package gives you access to all the MusicBrainz specific modules under [src](src/) except for the main modules of the bookmarklets and userscripts themselves.

The primary entry point of the `@kellnerd/musicbrainz-scripts` package is [index.js](index.js) which provides import shortcuts for stable, potentially useful pieces of code from `src/`.

- Shortcut usage: `import { buildEditNote } from '@kellnerd/musicbrainz-scripts';`

- Full specifier: `import { buildEditNote } from '@kellnerd/musicbrainz-scripts/src/editNote.js';`

You can also import utility functions from `utils/` if you want to:

- Example: `import { guessUnicodePunctuation } from '@kellnerd/musicbrainz-scripts/utils/string/punctuation.js';`

P.S. General utilities under `utils/` will get their own package in the near future, so you should only use them if you are willing to update all of your import statements once that happens.
