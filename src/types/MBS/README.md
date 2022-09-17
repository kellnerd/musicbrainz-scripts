## MusicBrainz Server Type Definitions

The files inside this directory are TypeScript versions of the original Flow type definitions from [musicbrainz-server](https://github.com/metabrainz/musicbrainz-server/blob/4ceee72bb11d5780c7f6fd1ee547b68fb1ae7473/root/types/) which are GPL licensed:

>	Copyright (C) MetaBrainz Foundation
>
>	This file is part of MusicBrainz, the open internet music database,
> and is licensed under the GPL version 2, or (at your option) any
> later version: http://www.gnu.org/licenses/gpl-2.0.txt

They were automatically converted using [@khanacademy/flow-to-ts](https://github.com/khan/flow-to-ts) and tweaked using a few global search and replace actions:

1. Run `npx @khanacademy/flow-to-ts --inline-utility-types --prettier --semi --single-quote --tab-width 2 --write root/types/*.js` inside the checked out `musicbrainz-server` repository.
2. Move all files from `root/types/*.ts` into this directory.
3. Fix remaining utility types by replacing `$Partial` with `Partial`.
4. Fix comments by manually replacing `(?<=;) //(.+)\n\n` with `\n\n//$1\n` using regular expressions (most inline comments are placed on the wrong line, but not all of them).
5. Insert an empty line between two declarations by replacing `;\n(?=declare)` with `;\n\n` using regular expressions.
