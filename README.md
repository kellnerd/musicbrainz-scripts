# musicbrainz-bookmarklets

**[Bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet) and [Userscripts](https://en.wikipedia.org/wiki/Userscript) for [MusicBrainz.org](https://musicbrainz.org)**

In order to use one of the **bookmarklets** you have to save the compressed code snippet from the respective section below as a bookmark. Make sure to add the bookmark to a toolbar of your browser which you can easily access while you are editing.

While bookmarklets are good for trying things out because they do not require additional software to be installed, **userscripts** are more convenient if you need a snippet frequently. In case you have installed a userscript manager browser extension you can simply install userscripts from this page by clicking the *Install* button. Another benefit of them is that you will receive automatic updates if your userscript manager is configured accordingly.

### Development

Running `node build.js` compiles [all userscripts](src/userscripts/) and [all bookmarklets](src/bookmarklets/) before it generates an updated version of `README.md`. Before you can run this command you have to ensure that you have setup *Node.js* and have installed the dependencies of the build script via `npm install`.

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
javascript:void $('.expand-disc').trigger('click');
```

- Expands all collapsed mediums in the release editor, useful for large releases.

## [Guess Unicode Punctuation](src/guessUnicodePunctuation.js)

[![Source](https://raw.github.com/jerone/UserScripts/master/_resources/Source-button.png)](dist/guessUnicodePunctuation.user.js)
[![Install](https://raw.github.com/jerone/UserScripts/master/_resources/Install-button.png)](dist/guessUnicodePunctuation.user.js?raw=1)

```js
javascript:(function(){function n(n,a){var g='background-color';$(n).css(g,'').each((n,t)=>{let e=t.value;e&&(a.forEach(([n,t])=>{e=e.replace(n,t)}),e!=t.value&&$(t).val(e).trigger('change').css(g,'yellow'))})}var t=[[/(?<=\W|^)"(.+?)"(?=\W|$)/g,'\u201c$1\u201d'],[/(?<=\W|^)'n'(?=\W|$)/g,'\u2019n\u2019'],[/(?<=\W|^)'(.+?)'(?=\W|$)/g,'\u2018$1\u2019'],[/(\d+)"/g,'$1\u2033'],[/(\d+)'(\d+)/g,'$1\u2032$2'],[/'/g,'\u2019'],[/(?<!\.)\.{3}(?!\.)/g,'\u2026'],[/ - /g,' \u2013 '],[/(\d{4})-(\d{2})-(\d{2})(?=\W|$)/g,'$1\u2010$2\u2010$3'],[/(\d{4})-(\d{2})(?=\W|$)/g,'$1\u2010$2'],[/(\d+)-(\d+)/g,'$1\u2013$2'],[/-/g,'\u2010']],e=[[/'''/g,'<b>'],[/''/g,'<i>'],[/\[(.+?)(\|.+?)?\]/g,(n,t,e='')=>`[${btoa(t)}${e}]`],...t,[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(n,t,e='')=>`[${atob(t)}${e}]`],[/<b>/g,"'''"],[/<i>/g,"''"]];n(['input#name','input#comment','input.track-name','input[id^=disc-title]','input[name$=name]','input[name$=comment]'].join(),t),n(['#annotation','#edit-note-text','textarea[name$=text]','.edit-note'].join(),e)})();
```

- Searches and replaces ASCII punctuation symbols for all title input fields by their preferred Unicode counterparts.
  These can only be guessed based on context as the ASCII symbols are ambiguous.
- Highlights all updated input fields in order to allow the user to review the changes.
- Works for release/medium/track titles and release disambiguation comments (in the release editor)
  and for entity names and disambiguation comments (on their respective edit and creation pages).
- Experimental support for annotations and edit notes. Preserves apostrophe-based markup (bold, italic) and URLs.
