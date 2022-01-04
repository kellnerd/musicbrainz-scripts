# musicbrainz-bookmarklets

**[Bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet) and [Userscripts](https://en.wikipedia.org/wiki/Userscript) for [MusicBrainz.org](https://musicbrainz.org)**

In order to use one of the **bookmarklets** you have to save the compressed code snippet from the respective section below as a bookmark. Make sure to add the bookmark to a toolbar of your browser which you can easily access while you are editing.

While bookmarklets are good for trying things out because they do not require additional software to be installed, **userscripts** are more convenient if you need a snippet frequently. In case you have installed a userscript manager browser extension you can simply install userscripts from this page by clicking the *Install* button. Another benefit of them is that you will receive automatic updates if your userscript manager is configured accordingly.

### Development

Running `node build.js` compiles [all userscripts](src/userscripts/) and [all bookmarklets](src/bookmarklets/) before it generates an updated version of `README.md`. Before you can run this command you have to ensure that you have setup *Node.js* and have installed the dependencies of the build script via `npm install`.

## [Annotation Converter](src/annotationConverter.js)

```js
javascript:(function(){var a=[[/\[(.+?)\]\((.+?)\)/g,'[$2|$1]'],[/(?<!\[)(https?:\/\/\S+)/g,'[$1]'],[/\[(.+?)(\|.+?)?\]/g,(a,t,e='')=>`[${btoa(t)}${e}]`],[/(__|\*\*)(?=\S)(.+?)(?<=\S)\1/g,"'''$2'''"],[/(_|\*)(?=\S)(.+?)(?<=\S)\1/g,"''$2''"],[/^\# +(.+?)( +\#*)?$/gm,'= $1 ='],[/^\#{2} +(.+?)( +\#*)?$/gm,'== $1 =='],[/^\#{3} +(.+?)( +\#*)?$/gm,'=== $1 ==='],[/^(\d+)\. +/gm,'    $1. '],[/^[-+*] +/gm,'    * '],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(a,t,e='')=>`[${atob(t)}${e}]`]];function n(a){return async function(a,t){const e=[];a.replace(t,(a,...t)=>{t=((a,t,e)=>async function(a,t=null){if(a.includes('musicbrainz.org')){const c=new URL(a);var[e,n,r]=c.pathname.match(/^\/(.+?)\/([0-9a-f-]{36})$/)||[];if(e)return t=t||await async function(a){a.pathname='/ws/2'+a.pathname,a.search='?fmt=json';let t=await fetch(a);return t=await t.json(),t.name||t.title}(c),`[${n}:${r}|${t}]`}return function(a,t=null){return t?`[${a}|${t}]`:`[${a}]`}(a,t)}(t,e))(a,...t),e.push(t)});const n=await Promise.all(e);return a.replace(t,()=>n.shift())}(a,/\[(.+?)(?:\|(.+?))?\]/g)}var t=['textarea[name$=text]','textarea[name$=description]','textarea[name$=biography]'].join(),r=a,c='background-color';$(t).css(c,'').each((a,t)=>{let e=t.value;e&&(r.forEach(([a,t])=>{e=e.replace(a,t)}),e!=t.value&&$(t).val(e).trigger('change').css(c,'yellow'))}),$(t).each(async(a,t)=>{var e=await n(t.value);e!=t.value&&$(t).val(e)})})();
```

- Allows entity annotations to be (partly) written in basic Markdown and converts them into valid annotation markup.
- Shortens absolute URLs to MusicBrainz entities to `[entity-type:mbid|label]` links.
- Automatically fetches and uses the name of the linked entity as label if none was given.
- Also supports collection descriptions and user profile biographies.

## [Batch Add Parts Of Series](src/bookmarklets/batchAddPartsOfSeries.js)

```js
javascript:(function(){const t=prompt('MBIDs of entities which should be added as parts of the series:');t&&async function(t){for(var e of t){const i=await async function(){const t=await fetch(`/ws/js/entity/${e}`);return MB.entity(await t.json())}(),o=(a=i,e=void 0,e=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor,new MB.relationshipEditor.UI.AddDialog({viewModel:e,source:e.source,target:a}));(a=i.name.match(/\d+/))&&o.relationship().setAttributes([{type:{gid:'a59c5830-5ec7-38fe-9a21-c7ea54f6650a'},text_value:a[0]}]),o.accept()}var a}(Array.from(t.matchAll(/[0-9a-f-]{36}/gm),t=>t[0]))})();
```

- Batch-adds entities as parts of the currently edited series.
- Automatically extracts numbers from titles and uses them as relationship attributes.

## [Change All Release Dates](src/changeAllReleaseDates.js)

```js
javascript:(function(){function e(e,a){$('input.partial-date-'+e).val(a).trigger('change')}var a,t,n=prompt('Date for all release events (YYYY-MM-DD):');null!==n&&([,a,t,n]=/(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(n)||[],t=t,n=n,e('year',a),e('month',t),e('day',n))})();
```

- Changes the date for all release events of a release according to the user's input.
- Useful to correct the dates for digital media releases with lots of release events which are using the wrong first
  release date of the release group.

## [Enumerate Track Titles](src/enumerateTrackTitles.js)

```js
javascript:(function(){const t=prompt('Numbering prefix, preceded by flags:\n+ append to current titles\n_ pad numbers','Part ');if(null!==t){let[,e,n]=t.match(/^([+_]*)(.*)/);e={append:e.includes('+'),padNumbers:e.includes('_')},function(a='',l={}){let e=$('input.track-name');var n=e.length.toString().length;const i=new Intl.NumberFormat('en',{minimumIntegerDigits:n});e.each((e,n)=>{let t=e+1;l.padNumbers&&(t=i.format(t));let r=a+t;l.append&&(r=(n.value+r).replace(/([.!?]),/,'$1')),$(n).val(r)}).trigger('change')}(n,e)}})();
```

- Renames all tracks using their absolute track number and a customizable prefix (which can be empty).
- Useful to number the parts of an audiobook without chapters and other releases with untitled tracks.
- Asks the user to input a numbering prefix which can optionally be preceded by flags:
  - Append the number (including the given prefix) to the current titles: `+`
  - Pad numbers with leading zeros to the same length: `_`
  - *Example*: `+_, Part ` renames track 27/143 "Title" to "Title, Part 027"

## [Expand Collapsed Mediums](src/expandCollapsedMediums.js)

```js
javascript:void $('.expand-medium').trigger('click');
```

- Expands all collapsed mediums in the release editor, useful for large releases.

## [Guess Series Relationship](src/bookmarklets/guessSeriesRelationship.js)

```js
javascript:void async function(e){if(o=e.match(/(.+?)(?: (\d+))?:/)){const i=(t=MB.entity({name:o[1]},'series'),e=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor,new MB.relationshipEditor.UI.AddDialog({viewModel:e,source:e.source,target:t}));var t,o=o[2];o&&i.relationship().setAttributes([{type:{gid:'a59c5830-5ec7-38fe-9a21-c7ea54f6650a'},text_value:o}]),(o=i).open(void 0),o.autocomplete.$input.focus(),o.autocomplete.search()}}(document.querySelector('h1 bdi').textContent);
```

- Guesses the series name from the name of the currently edited entity and adds a relationship.
- Tries to extract the series number from the entity name to use it as relationship attribute.

## [Guess Unicode Punctuation](src/guessUnicodePunctuation.js)

[![Source](https://raw.github.com/jerone/UserScripts/master/_resources/Source-button.png)](dist/guessUnicodePunctuation.user.js)
[![Install](https://raw.github.com/jerone/UserScripts/master/_resources/Install-button.png)](dist/guessUnicodePunctuation.user.js?raw=1)

```js
javascript:(function(){function t(t,e){var g='background-color';$(t).css(g,'').each((t,n)=>{let a=n.value;a&&(e.forEach(([t,n])=>{a=a.replace(t,n)}),a!=n.value&&$(n).val(a).trigger('change').css(g,'yellow'))})}var n=[[/(?<=[^\p{L}\d]|^)"(.+?)"(?=[^\p{L}\d]|$)/gu,'\u201c$1\u201d'],[/(?<=\W|^)'(n)'(?=\W|$)/gi,'\u2019$1\u2019'],[/(?<=[^\p{L}\d]|^)'(.+?)'(?=[^\p{L}\d]|$)/gu,'\u2018$1\u2019'],[/(\d+)"/g,'$1\u2033'],[/(\d+)'(\d+)/g,'$1\u2032$2'],[/'/g,'\u2019'],[/(?<!\.)\.{3}(?!\.)/g,'\u2026'],[/ - /g,' \u2013 '],[/(\d{4})-(\d{2})-(\d{2})(?=\W|$)/g,'$1\u2010$2\u2010$3'],[/(\d{4})-(\d{2})(?=\W|$)/g,'$1\u2010$2'],[/(\d+)-(\d+)/g,'$1\u2013$2'],[/-/g,'\u2010']],a=[[/\[(.+?)(\|.+?)?\]/g,(t,n,a='')=>`[${btoa(n)}${a}]`],[/(?<=\/\/)(\S+)/g,(t,n)=>btoa(n)],[/'''/g,'<b>'],[/''/g,'<i>'],...n,[/<b>/g,"'''"],[/<i>/g,"''"],[/(?<=\/\/)([A-Za-z0-9+/=]+)/g,(t,n)=>atob(n)],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(t,n,a='')=>`[${atob(n)}${a}]`]];t(['input#name','input#comment','input.track-name','input[id^=medium-title]','input[name$=name]','input[name$=comment]'].join(),n),t(['#annotation','#edit-note-text','textarea[name$=text]','.edit-note'].join(),a)})();
```

- Searches and replaces ASCII punctuation symbols for all title input fields by their preferred Unicode counterparts.
  These can only be guessed based on context as the ASCII symbols are ambiguous.
- Highlights all updated input fields in order to allow the user to review the changes.
- Works for release/medium/track titles and release disambiguation comments (in the release editor)
  and for entity names and disambiguation comments (on their respective edit and creation pages).
- Experimental support for annotations and edit notes. Preserves apostrophe-based markup (bold, italic) and URLs.

## [Parse Copyright Text](src/parseCopyrightText.js)

[![Source](https://raw.github.com/jerone/UserScripts/master/_resources/Source-button.png)](dist/parseCopyrightText.user.js)
[![Install](https://raw.github.com/jerone/UserScripts/master/_resources/Install-button.png)](dist/parseCopyrightText.user.js?raw=1)

```js
javascript:(function(){async function e(e,t){return(await fetch(`/ws/js/${e}?q=${encodeURIComponent(t)}`)).json()}function t(e){const t=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor;return new MB.relationshipEditor.UI.AddDialog({viewModel:t,source:t.source,target:e})}function n(e){return new Promise((t=>{e?e.$dialog.on("dialogclose",(()=>{t()})):t()}))}function o(e,t){e.open(t),e.autocomplete.$input.focus(),e.autocomplete.search()}function a(e,t){return t.forEach((([t,n])=>{e=e.replace(t,n)})),e}const c={release:{label:{"\xa9":708,"\u2117":711,"licensed from":712,"licensed to":833,"marketed by":848}}};function r(e){return a(e.toLowerCase().trim(),[["licence","license"]])}const s=prompt("Copyright text:");s&&async function(a,r=!1){for(const s of a){const a="label",i=c.release[a],l=MB.entity(r?(await e(a,s.name))[0]:{name:s.name,entityType:a});for(const e of s.types){const a=t(l),c=a.relationship();c.linkTypeID(i[e]),c.entity0_credit(s.name),s.year&&(c.begin_date.year(s.year),c.end_date.year(s.year)),r?a.accept():(o(a),await n(a))}}}(function(e){const t=[],n=(e=a(e,[[/\(C\)/gi,"\xa9"],[/\(P\)/gi,"\u2117"],[/\xab(.+?)\xbb/g,"$1"]])).matchAll(/([\xa9\u2117]|\u2117\s*[&+]\s*\xa9)\s*(\d+)\s+([^.,]+)/g);for(const e of n){const n=e[1].split(/[&+]/).map(r);t.push({name:e[3],types:n,year:e[2]})}const o=e.matchAll(/(licen[sc]ed (?:to|from)|marketed by)\s+([^.,]+)/gi);for(const e of o)t.push({name:e[2],types:[r(e[1])]});return t}(s))})();
```

- Extracts all copyright data and legal information from the given text.
- Assists the user to create release-label relationships for these.

## [Relate This Entity To Multiple MBIDs](src/bookmarklets/relateThisEntityToMultipleMBIDs.js)

```js
javascript:(function(){const t=prompt('MBIDs of entities which should be related to this entity:');t&&async function(t){for(var o of t){var e=await async function(){const t=await fetch(`/ws/js/entity/${o}`);return MB.entity(await t.json())}();const i=(o=e,e=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor,new MB.relationshipEditor.UI.AddDialog({viewModel:e,source:e.source,target:o}));i.accept()}}(Array.from(t.matchAll(/[0-9a-f-]{36}/gm),t=>t[0]))})();
```

- Relates the currently edited entity to multiple entities given by their MBIDs.
- Automatically uses the default relationship type between the two entity types.

## [Voice Actor Credits](src/voiceActorCredits.js)

[![Source](https://raw.github.com/jerone/UserScripts/master/_resources/Source-button.png)](dist/voiceActorCredits.user.js)
[![Install](https://raw.github.com/jerone/UserScripts/master/_resources/Install-button.png)](dist/voiceActorCredits.user.js?raw=1)

```js
javascript:void function(e={}){var t=MB.releaseRelationshipEditor,e=MB.entity(e,'artist');const i=new MB.relationshipEditor.UI.AddDialog({source:t.source,target:e,viewModel:t}),r=i.relationship();return r.linkTypeID(60),r.entity0_credit(""),r.setAttributes([{type:{gid:'d3a36e62-a7c4-4eb9-839f-adfebe87ac12'},credited_as:""}]),i}().open();
```

- Simplifies the addition of “spoken vocals” relationships (at release level) by providing a pre-filled dialogue in the relationship editor.
- Imports voice actor credits from linked Discogs pages (userscript only).
- Automatically matches artists whose Discogs pages are linked to MB (unlinked artists can be selected from the already opened inline search).
