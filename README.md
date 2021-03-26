# musicbrainz-bookmarklets

**[Bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet) and [Userscripts](https://en.wikipedia.org/wiki/Userscript) for [MusicBrainz.org](https://musicbrainz.org)**

In order to use one of the **bookmarklets** you have to save the compressed code snippet from the respective section below as a bookmark. Make sure to add the bookmark to a toolbar of your browser which you can easily access while you are editing.

While bookmarklets are good for trying things out because they do not require additional software to be installed, **userscripts** are more convenient if you need a snippet frequently. In case you have installed a userscript manager browser extension you can simply install userscripts from this page by clicking the *Install* button. Another benefit of them is that you will receive automatic updates if your userscript manager is configured accordingly.

### Development

Running `node build.js` compiles [all userscripts](src/userscripts/) and [all bookmarklets](src/bookmarklets/) before it generates an updated version of `README.md`. Before you can run this command you have to ensure that you have setup *Node.js* and have installed the dependencies of the build script via `npm install`.

## [Annotation Converter](src/annotationConverter.js)

```js
javascript:(function(){function e(a){return async function(a,n){const t=[];a.replace(n,(a,...n)=>{n=((a,n,t)=>async function(a,n=null){if(a.includes('musicbrainz.org')){const r=new URL(a);var[t,e,c]=r.pathname.match(/^\/(.+?)\/([0-9a-f-]{36})$/)||[];if(t)return n=n||await async function(a){a.pathname=`/ws/2${a.pathname}`,a.search='?fmt=json';let n=await fetch(a);return n=await n.json(),n.name||n.title}(r),`[${e}:${c}|${n}]`}return function(a,n=null){return n?`[${a}|${n}]`:`[${a}]`}(a,n)}(n,t))(a,...n),t.push(n)});const e=await Promise.all(t);return a.replace(n,()=>e.shift())}(a,/\[(.+?)(?:\|(.+?))?\]/g)}var a='textarea[name$=text]',c=[[/(__|\*\*)(?=\S)(.+?)(?<=\S)\1/g,"'''$2'''"],[/(_|\*)(?=\S)(.+?)(?<=\S)\1/g,"''$2''"],[/\[(.+?)\]\((.+?)\)/g,'[$2|$1]'],[/(?<!\[)(https?:\/\/\S+)/g,'[$1]'],[/^\# +(.+?)( +\#*)?$/gm,'= $1 ='],[/^\#{2} +(.+?)( +\#*)?$/gm,'== $1 =='],[/^\#{3} +(.+?)( +\#*)?$/gm,'=== $1 ==='],[/^(\d+)\. +/gm,'    $1. '],[/^[-+*] +/gm,'    * ']],r='background-color';$(a).css(r,'').each((a,n)=>{let t=n.value;t&&(c.forEach(([a,n])=>{t=t.replace(a,n)}),t!=n.value&&$(n).val(t).trigger('change').css(r,'yellow'))}),$(a).each(async(a,n)=>{var t=await e(n.value);t!=n.value&&$(n).val(t)})})();
```

- Allows entity annotations to be (partly) written in basic Markdown and converts them into valid annotation markup.
- Shortens absolute URLs to MusicBrainz entities to `[entity-type:mbid|label]` links.
- Automatically fetches and uses the name of the linked entity as label if none was given.

## [Change All Release Dates](src/changeAllReleaseDates.js)

```js
javascript:(function(){function e(e,a){$('input.partial-date-'+e).val(a).trigger('change')}var a=prompt('Date for all release events (YYYY-MM-DD):'),[,t,n,a]=/(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(a)||[],n=n,a=a;e('year',t),e('month',n),e('day',a)})();
```

- Changes the date for all release events of a release according to the user's input.
- Useful to correct the dates for digital media releases with lots of release events which are using the wrong first
  release date of the release group.

## [Enumerate Track Titles](src/enumerateTrackTitles.js)

```js
javascript:(function(){const e=prompt('Numbering prefix, preceded by flags:\n+ append to current titles\n_ pad numbers','Part ');let[,n,t]=e.match(/^([+_]*)(.+)/);n={append:n.includes('+'),padNumbers:n.includes('_')},function(a='',p={}){let e=$('input.track-name');var n=e.length.toString().length;const i=new Intl.NumberFormat('en',{minimumIntegerDigits:n});e.each((e,n)=>{let t=e+1;p.padNumbers&&(t=i.format(t));let r=a+t;p.append&&(r=(n.value+r).replace(/([.!?]),/,'$1')),$(n).val(r)}).trigger('change')}(t,n)})();
```

- Renames all tracks using their absolute track number and a customizable prefix.
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

## [Guess Unicode Punctuation](src/guessUnicodePunctuation.js)

[![Source](https://raw.github.com/jerone/UserScripts/master/_resources/Source-button.png)](dist/guessUnicodePunctuation.user.js)
[![Install](https://raw.github.com/jerone/UserScripts/master/_resources/Install-button.png)](dist/guessUnicodePunctuation.user.js?raw=1)

```js
javascript:(function(){function n(n,a){var g='background-color';$(n).css(g,'').each((n,t)=>{let e=t.value;e&&(a.forEach(([n,t])=>{e=e.replace(n,t)}),e!=t.value&&$(t).val(e).trigger('change').css(g,'yellow'))})}var t=[[/(?<=\W|^)"(.+?)"(?=\W|$)/g,'\u201c$1\u201d'],[/(?<=\W|^)'n'(?=\W|$)/g,'\u2019n\u2019'],[/(?<=\W|^)'(.+?)'(?=\W|$)/g,'\u2018$1\u2019'],[/(\d+)"/g,'$1\u2033'],[/(\d+)'(\d+)/g,'$1\u2032$2'],[/'/g,'\u2019'],[/(?<!\.)\.{3}(?!\.)/g,'\u2026'],[/ - /g,' \u2013 '],[/(\d{4})-(\d{2})-(\d{2})(?=\W|$)/g,'$1\u2010$2\u2010$3'],[/(\d{4})-(\d{2})(?=\W|$)/g,'$1\u2010$2'],[/(\d+)-(\d+)/g,'$1\u2013$2'],[/-/g,'\u2010']],e=[[/'''/g,'<b>'],[/''/g,'<i>'],[/\[(.+?)(\|.+?)?\]/g,(n,t,e='')=>`[${btoa(t)}${e}]`],...t,[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(n,t,e='')=>`[${atob(t)}${e}]`],[/<b>/g,"'''"],[/<i>/g,"''"]];n(['input#name','input#comment','input.track-name','input[id^=medium-title]','input[name$=name]','input[name$=comment]'].join(),t),n(['#annotation','#edit-note-text','textarea[name$=text]','.edit-note'].join(),e)})();
```

- Searches and replaces ASCII punctuation symbols for all title input fields by their preferred Unicode counterparts.
  These can only be guessed based on context as the ASCII symbols are ambiguous.
- Highlights all updated input fields in order to allow the user to review the changes.
- Works for release/medium/track titles and release disambiguation comments (in the release editor)
  and for entity names and disambiguation comments (on their respective edit and creation pages).
- Experimental support for annotations and edit notes. Preserves apostrophe-based markup (bold, italic) and URLs.
