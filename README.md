# musicbrainz-bookmarklets

**[Bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet) and [Userscripts](https://en.wikipedia.org/wiki/Userscript) for [MusicBrainz.org](https://musicbrainz.org)**

In order to use one of the **bookmarklets** you have to save the compressed code snippet from the respective section below as a bookmark. Make sure to add the bookmark to a toolbar of your browser which you can easily access while you are editing on MusicBrainz.

While bookmarklets are good for trying things out because they do not require additional software to be installed, **userscripts** are more convenient if you need a snippet frequently. In case you have installed a userscript manager browser extension you can simply install userscripts from this page by clicking the *Install* button. Another benefit of them is that you will receive automatic updates if your userscript manager is configured accordingly.

## Bookmarklets & Userscripts

### [Annotation Converter](src/annotationConverter.js)

```js
javascript:(function(){var a=[[/\[(.+?)\]\((.+?)\)/g,'[$2|$1]'],[/(?<!\[)(https?:\/\/\S+)/g,'[$1]'],[/\[(.+?)(\|.+?)?\]/g,(a,t,e='')=>`[${btoa(t)}${e}]`],[/(__|\*\*)(?=\S)(.+?)(?<=\S)\1/g,"'''$2'''"],[/(_|\*)(?=\S)(.+?)(?<=\S)\1/g,"''$2''"],[/^\# +(.+?)( +\#*)?$/gm,'= $1 ='],[/^\#{2} +(.+?)( +\#*)?$/gm,'== $1 =='],[/^\#{3} +(.+?)( +\#*)?$/gm,'=== $1 ==='],[/^(\d+)\. +/gm,'    $1. '],[/^[-+*] +/gm,'    * '],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(a,t,e='')=>`[${atob(t)}${e}]`]];function n(a){return async function(a,t){const e=[];a.replace(t,(a,...t)=>{t=((a,t,e)=>async function(a,t){if(a.includes('musicbrainz.org')){const c=new URL(a);var[e,n,r]=c.pathname.match(/^\/(.+?)\/([0-9a-f-]{36})$/)||[];if(e)return t=t||await async function(a){a.pathname='/ws/2'+a.pathname,a.search='?fmt=json';let t=await fetch(a);return t=await t.json(),t.name||t.title}(c),`[${n}:${r}|${t}]`}return function(a,t){return t?`[${a}|${t}]`:`[${a}]`}(a,t)}(t,e))(a,...t);e.push(t)});const n=await Promise.all(e);return a.replace(t,()=>n.shift())}(a,/\[(.+?)(?:\|(.+?))?\]/g)}var t=['textarea[name$=text]','textarea[name$=description]','textarea[name$=biography]'].join();!function(n){const r='background-color';$(t).css(r,'').each((a,t)=>{let e=t.value;e&&(n.forEach(([a,t])=>{e=e.replace(a,t)}),e!=t.value&&$(t).val(e).trigger('change').css(r,'yellow'))})}(a),$(t).each(async(a,t)=>{t.disabled=!0;var e=await n(t.value);e!=t.value&&$(t).val(e),t.disabled=!1})})();
```

- Allows entity annotations to be (partly) written in basic Markdown and converts them into valid annotation markup.
- Shortens absolute URLs to MusicBrainz entities to `[entity-type:mbid|label]` links.
- Automatically fetches and uses the name of the linked entity as label if none was given.
- Also supports collection descriptions and user profile biographies.

### [Batch Add Parts Of Series](src/bookmarklets/batchAddPartsOfSeries.js)

```js
javascript:(function(){const t=prompt('MBIDs of entities which should be added as parts of the series:');t&&async function(t){for(var e of t){const o=await async function(){const t=await fetch("/ws/js/entity/"+e);return MB.entity(await t.json())}(),s=(a=o,i=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor,new MB.relationshipEditor.UI.AddDialog({viewModel:i,source:i.source,target:a}));a=o.name.match(/\d+/);a&&s.relationship().setAttributes([{type:{gid:'a59c5830-5ec7-38fe-9a21-c7ea54f6650a'},text_value:a[0]}]),s.accept()}var a,i}(Array.from(t.matchAll(/[0-9a-f-]{36}/gm),t=>t[0]))})();
```

- Batch-adds entities as parts of the currently edited series.
- Automatically extracts numbers from titles and uses them as relationship attributes.

### [Change All Release Dates](src/changeAllReleaseDates.js)

```js
javascript:(function(){function e(e,a){$('input.partial-date-'+e).val(a).trigger('change')}var a,t,n=prompt('Date for all release events (YYYY-MM-DD):');null!==n&&([,a,t,n]=/(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(n)||[],t=t,n=n,e('year',a),e('month',t),e('day',n))})();
```

- Changes the date for all release events of a release according to the user's input.
- Useful to correct the dates for digital media releases with lots of release events which are using the wrong first
  release date of the release group.

### [Enumerate Track Titles](src/enumerateTrackTitles.js)

```js
javascript:(function(){const t=prompt('Numbering prefix, preceded by flags:\n+ append to current titles\n_ pad numbers','Part ');if(null!==t){let[,e,n]=t.match(/^([+_]*)(.*)/);e={append:e.includes('+'),padNumbers:e.includes('_')},function(a='',l={}){let e=$('input.track-name');var n=e.length.toString().length;const i=new Intl.NumberFormat('en',{minimumIntegerDigits:n});e.each((e,n)=>{let t=e+1;l.padNumbers&&(t=i.format(t));let r=a+t;l.append&&(r=(n.value+r).replace(/([.!?]),/,'$1')),$(n).val(r)}).trigger('change')}(n,e)}})();
```

- Renames all tracks using their absolute track number and a customizable prefix (which can be empty).
- Useful to number the parts of an audiobook without chapters and other releases with untitled tracks.
- Asks the user to input a numbering prefix which can optionally be preceded by flags:
  - Append the number (including the given prefix) to the current titles: `+`
  - Pad numbers with leading zeros to the same length: `_`
  - *Example*: `+_, Part ` renames track 27/143 "Title" to "Title, Part 027"

### [Expand Collapsed Mediums](src/expandCollapsedMediums.js)

```js
javascript:void $('.expand-medium').trigger('click');
```

- Expands all collapsed mediums in the release editor, useful for large releases.

### [Guess Series Relationship](src/bookmarklets/guessSeriesRelationship.js)

```js
javascript:void async function(e){var t=e.match(/(.+?)(?: (\d+))?:/);if(t){const i=(o=MB.entity({name:t[1]},'series'),e=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor,new MB.relationshipEditor.UI.AddDialog({viewModel:e,source:e.source,target:o}));var o,t=t[2];t&&i.relationship().setAttributes([{type:{gid:'a59c5830-5ec7-38fe-9a21-c7ea54f6650a'},text_value:t}]),(t=i).open(void 0),t.autocomplete.$input.focus(),t.autocomplete.search()}}(document.querySelector('h1 bdi').textContent);
```

- Guesses the series name from the name of the currently edited entity and adds a relationship.
- Tries to extract the series number from the entity name to use it as relationship attribute.

### [Guess Unicode Punctuation](src/guessUnicodePunctuation.js)

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/guessUnicodePunctuation.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/guessUnicodePunctuation.user.js)

```js
javascript:(function(){function e(e,n){const g='background-color';$(e).css(g,'').each((e,t)=>{let a=t.value;a&&(n.forEach(([e,t])=>{a=a.replace(e,t)}),a!=t.value&&$(t).val(a).trigger('change').css(g,'yellow'))})}var t=[[/(?<=[^\p{L}\d]|^)"(.+?)"(?=[^\p{L}\d]|$)/gu,'\u201c$1\u201d'],[/(?<=\W|^)'(n)'(?=\W|$)/gi,'\u2019$1\u2019'],[/(?<=[^\p{L}\d]|^)'(.+?)'(?=[^\p{L}\d]|$)/gu,'\u2018$1\u2019'],[/(\d+)"/g,'$1\u2033'],[/(\d+)'(\d+)/g,'$1\u2032$2'],[/'/g,'\u2019'],[/(?<!\.)\.{3}(?!\.)/g,'\u2026'],[/ - /g,' \u2013 '],[/\d{4}-\d{2}(?:-\d{2})?(?=\W|$)/g,e=>Number.isNaN(Date.parse(e))?e:e.replaceAll('-','\u2010')],[/\d+(-\d+){2,}/g,e=>e.replaceAll('-','\u2012')],[/(\d+)-(\d+)/g,'$1\u2013$2'],[/-/g,'\u2010']],a=[[/\[(.+?)(\|.+?)?\]/g,(e,t,a='')=>`[${btoa(t)}${a}]`],[/(?<=\/\/)(\S+)/g,(e,t)=>btoa(t)],[/'''/g,'<b>'],[/''/g,'<i>'],...t,[/<b>/g,"'''"],[/<i>/g,"''"],[/(?<=\/\/)([A-Za-z0-9+/=]+)/g,(e,t)=>atob(t)],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(e,t,a='')=>`[${atob(t)}${a}]`]];e(['input#name','input#comment','input.track-name','input[id^=medium-title]','input[name$=name]','input[name$=comment]'].join(),t),e(['#annotation','#edit-note-text','textarea[name$=text]','.edit-note'].join(),a)})();
```

- Searches and replaces ASCII punctuation symbols for all title input fields by their preferred Unicode counterparts.
  These can only be guessed based on context as the ASCII symbols are ambiguous.
- Highlights all updated input fields in order to allow the user to review the changes.
- Works for release/medium/track titles and release disambiguation comments (in the release editor)
  and for entity names and disambiguation comments (on their respective edit and creation pages).
- Detects the selected language (in the release editor) and uses localized quotes (userscript only).
- Experimental support for annotations and edit notes. Preserves apostrophe-based markup (bold, italic) and URLs.

### [Load Release With Magic ISRC](src/bookmarklets/loadReleaseWithMagicISRC.js)

```js
javascript:(function(){var a=location.pathname.match(/release\/([0-9a-f-]{36})/)?.[1];a&&open('https://magicisrc.kepstin.ca?mbid='+a)})();
```

- Opens [kepstin’s MagicISRC](https://magicisrc.kepstin.ca) and loads the currently visited MusicBrainz release.

### [Parse Copyright Notice](src/parseCopyrightNotice.js)

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/parseCopyrightNotice.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/parseCopyrightNotice.user.js)

```js
javascript:(function(){function s(t,e){return e.forEach(([e,o])=>{t=t.replace(e,o)}),t}var e=/(.+?(?:,? (?:LLC|LLP|Inc\.?))?)(?:(?<=\.)|$|(?=,|\.| under ))/;const a=new RegExp(/([\xa9\u2117](?:\s*[&+]?\s*[\xa9\u2117])?)(?:.+?;)?\s*(\d{4})?\s+/.source+e.source,'gm'),c=new RegExp(/(licen[sc]ed? (?:to|from)|(?:distributed|marketed) by)\s+/.source+e.source,'gim');function l(e){return s(e.toLowerCase().trim(),[[/licen[sc]ed?/g,'licensed']])}const d={release:{label:{'\xa9':708,'\u2117':711,'licensed from':712,'licensed to':833,'distributed by':361,'marketed by':848}},recording:{label:{'\u2117':867}}};var u=prompt('Copyright notice:');u&&async function(e){for(const i of e){var o='label',t=d.release[o],r=MB.entity({name:i.name,entityType:o});for(const s of i.types){const a=(n=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor,new MB.relationshipEditor.UI.AddDialog({viewModel:n,source:n.source,target:r})),c=a.relationship();c.linkTypeID(t[s]),c.entity0_credit(i.name),i.year&&(c.begin_date.year(i.year),c.end_date.year(i.year)),(n=a).open(void 0),n.autocomplete.$input.focus(),n.autocomplete.search(),await function(o){return new Promise(e=>{o?o.$dialog.on('dialogclose',()=>{e()}):e()})}(a)}}var n}(function(e){const o=[];for(const t of(e=s(u,[[/\(C\)/gi,'\xa9'],[/\(P\)/gi,'\u2117'],[/\xab(.+?)\xbb/g,'$1'],[/for (.+?) and (.+?) for the world outside \1/g,'/ $2']])).matchAll(a)){const r=t[3].split(/\/(?=\s|\w{2})/g).map(e=>e.trim()),n=t[1].split(/[&+]|(?<=[\xa9\u2117])(?=[\xa9\u2117])/).map(l);r.forEach(e=>{o.push({name:e,types:n,year:t[2]})})}for(const i of e.matchAll(c))o.push({name:i[2],types:[l(i[1])]});return o}(u))})();
```

- Extracts all copyright and legal information from the given text.
- Assists the user to create release-label relationships for these.
- Also creates phonographic copyright relationships for all selected recordings (userscript only).

### [Relate This Entity To Multiple MBIDs](src/bookmarklets/relateThisEntityToMultipleMBIDs.js)

```js
javascript:(function(){const t=prompt('MBIDs of entities which should be related to this entity:');t&&async function(t,i,e=!1){for(var o of t){var n=await async function(){const t=await fetch("/ws/js/entity/"+o);return MB.entity(await t.json())}();const r=(a=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor,new MB.relationshipEditor.UI.AddDialog({viewModel:a,source:a.source,target:n}));if(i){const s=r.relationship();s.linkTypeID(i),e&&r.changeDirection()}r.accept()}var a}(Array.from(t.matchAll(/[0-9a-f-]{36}/gm),t=>t[0]))})();
```

- Relates the currently edited entity to multiple entities given by their MBIDs.
- Automatically uses the default relationship type between the two entity types.

### [Voice Actor Credits](src/voiceActorCredits.js)

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/voiceActorCredits.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/voiceActorCredits.user.js)

```js
javascript:void function(){var e=MB.releaseRelationshipEditor,t=MB.entity({},'artist');const i=new MB.relationshipEditor.UI.AddDialog({source:e.source,target:t,viewModel:e}),r=i.relationship();return r.linkTypeID(60),r.entity0_credit(""),r.setAttributes([{type:{gid:'d3a36e62-a7c4-4eb9-839f-adfebe87ac12'},credited_as:""}]),i}().open();
```

- Simplifies the addition of “spoken vocals” relationships (at release level) by providing a pre-filled dialogue in the relationship editor.
- Imports voice actor credits from linked Discogs pages (userscript only).
- Automatically matches artists whose Discogs pages are linked to MB (unlinked artists can be selected from the already opened inline search).

## Development

Running `npm run build` compiles [all userscripts](src/userscripts/) and [all bookmarklets](src/bookmarklets/) before it generates an updated version of `README.md`. Before you can run this command you have to ensure that you have setup [Node.js](https://nodejs.org/) and have installed the dependencies of the build script via `npm install`.

If you want to compile a minified bookmarklet from a standalone JavaScript file you can run `node bookmarkletify.js file.js`. The result will be output directly on screen and no files will be modified.
