# musicbrainz-bookmarklets

**[Bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet) and [Userscripts](https://en.wikipedia.org/wiki/Userscript) for [MusicBrainz.org](https://musicbrainz.org)**

In order to use one of the **bookmarklets** you have to save the compressed code snippet from the respective section below as a bookmark. Make sure to add the bookmark to a toolbar of your browser which you can easily access while you are editing on MusicBrainz.

While bookmarklets are good for trying things out because they do not require additional software to be installed, **userscripts** are more convenient if you need a snippet frequently. In case you have installed a userscript manager browser extension you can simply install userscripts from this page by clicking the *Install* button. Another benefit of them is that you will receive automatic updates if your userscript manager is configured accordingly.

## Bookmarklets & Userscripts

### [Annotation Converter](src/annotationConverter.js)

```js
javascript:(function(){var a=[[/\[(.+?)\]\((.+?)\)/g,'[$2|$1]'],[/(?<!\[)(https?:\/\/\S+)/g,'[$1]'],[/\[(.+?)(\|.+?)?\]/g,(a,t,e='')=>`[${btoa(t)}${e}]`],[/(__|\*\*)(?=\S)(.+?)(?<=\S)\1/g,"'''$2'''"],[/(_|\*)(?=\S)(.+?)(?<=\S)\1/g,"''$2''"],[/^\# +(.+?)( +\#*)?$/gm,'= $1 ='],[/^\#{2} +(.+?)( +\#*)?$/gm,'== $1 =='],[/^\#{3} +(.+?)( +\#*)?$/gm,'=== $1 ==='],[/^(\d+)\. +/gm,'    $1. '],[/^[-+*] +/gm,'    * '],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(a,t,e='')=>`[${atob(t)}${e}]`]];function n(a){return async function(a,t){const e=[];a.replace(t,(a,...t)=>{t=((a,t,e)=>async function(a,t){if(a.includes('musicbrainz.org')){const c=new URL(a);var[e,n,r]=c.pathname.match(/^\/(.+?)\/([0-9a-f-]{36})$/)||[];if(e)return t=t||await async function(a){a.pathname='/ws/2'+a.pathname,a.search='?fmt=json';let t=await fetch(a);return t=await t.json(),t.name||t.title}(c),`[${n}:${r}|${t}]`}return function(a,t){return t?`[${a}|${t}]`:`[${a}]`}(a,t)}(t,e))(a,...t),e.push(t)});const n=await Promise.all(e);return a.replace(t,()=>n.shift())}(a,/\[(.+?)(?:\|(.+?))?\]/g)}var t=['textarea[name$=text]','textarea[name$=description]','textarea[name$=biography]'].join();!function(n){const r='background-color';$(t).css(r,'').each((a,t)=>{let e=t.value;e&&(n.forEach(([a,t])=>{e=e.replace(a,t)}),e!=t.value&&$(t).val(e).trigger('change').css(r,'yellow'))})}(a),$(t).each(async(a,t)=>{t.disabled=!0;var e=await n(t.value);e!=t.value&&$(t).val(e),t.disabled=!1})})();
```

- Allows entity annotations to be (partly) written in basic Markdown and converts them into valid annotation markup.
- Shortens absolute URLs to MusicBrainz entities to `[entity-type:mbid|label]` links.
- Automatically fetches and uses the name of the linked entity as label if none was given.
- Also supports collection descriptions and user profile biographies.

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

### [Guess Unicode Punctuation](src/guessUnicodePunctuation.js)

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/guessUnicodePunctuation.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/guessUnicodePunctuation.user.js)

```js
javascript:(function(){function t(t,a){const g='background-color';$(t).css(g,'').each((t,n)=>{let e=n.value;e&&(a.forEach(([t,n])=>{e=e.replace(t,n)}),e!=n.value&&$(n).val(e).trigger('change').css(g,'yellow'))})}var n=[[/(?<=[^\p{L}\d]|^)"(.+?)"(?=[^\p{L}\d]|$)/gu,'\u201c$1\u201d'],[/(?<=\W|^)'(n)'(?=\W|$)/gi,'\u2019$1\u2019'],[/(?<=[^\p{L}\d]|^)'(.+?)'(?=[^\p{L}\d]|$)/gu,'\u2018$1\u2019'],[/(\d+)"/g,'$1\u2033'],[/(\d+)'(\d+)/g,'$1\u2032$2'],[/'/g,'\u2019'],[/(?<!\.)\.{3}(?!\.)/g,'\u2026'],[/ - /g,' \u2013 '],[/(\d{4})-(\d{2})-(\d{2})(?=\W|$)/g,'$1\u2010$2\u2010$3'],[/(\d{4})-(\d{2})(?=\W|$)/g,'$1\u2010$2'],[/(\d+)-(\d+)/g,'$1\u2013$2'],[/-/g,'\u2010']],e=[[/\[(.+?)(\|.+?)?\]/g,(t,n,e='')=>`[${btoa(n)}${e}]`],[/(?<=\/\/)(\S+)/g,(t,n)=>btoa(n)],[/'''/g,'<b>'],[/''/g,'<i>'],...n,[/<b>/g,"'''"],[/<i>/g,"''"],[/(?<=\/\/)([A-Za-z0-9+/=]+)/g,(t,n)=>atob(n)],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(t,n,e='')=>`[${atob(n)}${e}]`]];t(['input#name','input#comment','input.track-name','input[id^=medium-title]','input[name$=name]','input[name$=comment]'].join(),n),t(['#annotation','#edit-note-text','textarea[name$=text]','.edit-note'].join(),e)})();
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

### [Voice Actor Credits](src/voiceActorCredits.js)

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/voiceActorCredits.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/voiceActorCredits.user.js)

```js
javascript:void function(e={}){var t=MB.releaseRelationshipEditor,e=new MB.entity.Artist(e);const i=new MB.relationshipEditor.UI.AddDialog({source:t.source,target:e,viewModel:t}),n=i.relationship();return n.linkTypeID(60),n.setAttributes([{type:{gid:'d3a36e62-a7c4-4eb9-839f-adfebe87ac12'},credited_as:""}]),i}().open(document.createEvent('MouseEvent'));
```

- Simplifies the addition of “spoken vocals” relationships (at release level) by providing a pre-filled dialogue in the relationship editor.

## Development

Running `npm run build` compiles [all userscripts](src/userscripts/) and [all bookmarklets](src/bookmarklets/) before it generates an updated version of `README.md`. Before you can run this command you have to ensure that you have setup [Node.js](https://nodejs.org/) and have installed the dependencies of the build script via `npm install`.

If you want to compile a minified bookmarklet from a standalone JavaScript file you can run `node bookmarkletify.js file.js`. The result will be output directly on screen and no files will be modified.
