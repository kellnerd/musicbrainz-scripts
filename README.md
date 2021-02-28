# musicbrainz-bookmarklets

**[Bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet) and other JavaScript snippets for MusicBrainz.org**

In order to use one of the bookmarklets you have to save the compressed code snippet from the respective section below as a bookmark. Make sure to add the bookmark to a toolbar of your browser which you can easily access while you are editing.

Running `node run build` compiles [all bookmarklets](src/bookmarklets/) and generates an updated version of `README.md` which is based on the most recent version of the code. Before you can run this command you have to ensure that you have setup *Node.js* and have installed the dependencies of the build script via `npm install`.

## [Change All Release Dates](src/changeAllReleaseDates.js)

```js
javascript:(function(){function e(e,a){$('input.partial-date-'+e).val(a).trigger('change')}var a=prompt('Date for all release events (YYYY-MM-DD):'),[,t,n,a]=/(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(a)||[],n=n,a=a;e('year',t),e('month',n),e('day',a)})();
```

- Changes the date for all release events of a release according to the user's input.
- Useful to correct the dates for digital media releases with lots of release events which are using the wrong first
  release date of the release group.

## [Enumerate Track Titles](src/enumerateTrackTitles.js)

```js
javascript:(function(){const e=prompt('Numbering prefix, preceded by flags:\n+ append to current titles\n_ pad numbers','Part ');let[,n,t]=e.match(/^([+_]*)(.+)/);n={append:n.includes('+'),padNumbers:n.includes('_')},function(r='',p={}){let e=$('input.track-name');var n=e.length.toString().length;const l=new Intl.NumberFormat('en',{minimumIntegerDigits:n});e.each((e,n)=>{let t=e+1;p.padNumbers&&(t=l.format(t));let a=r+t;p.append&&(a=(n.value+a).replace(/([.!?]),/,'$1')),$(n).val(a)})}(t,n)})();
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

```js
javascript:(function(){var d=(d=['input#name','input.track-name','input[id^=disc-title]','#id-edit-recording\\.name','#id-edit-work\\.name']).join(),a=[[/(?<=\W|^)"(.+?)"(?=\W|$)/g,'\u201c$1\u201d'],[/(?<=\W|^)'(.+?)'(?=\W|$)/g,'\u2018$1\u2019'],[/(\d+)"/g,'$1\u2033'],[/(\d+)'(\d+)/g,'$1\u2032$2'],[/'/g,'\u2019'],[/(?<!\.)\.{3}(?!\.)/g,'\u2026'],[/ - /g,' \u2013 '],[/(\d{4})-(\d{2})-(\d{2})(?=\W|$)/g,'$1\u2010$2\u2010$3'],[/(\d{4})-(\d{2})(?=\W|$)/g,'$1\u2010$2'],[/(\d+)-(\d+)/g,'$1\u2013$2'],[/-/g,'\u2010']];$(d).css('background-color',''),$(d).each((d,e)=>{let g=e.value;g&&(a.forEach(([d,$])=>{g=g.replace(d,$)}),g!=e.value&&$(e).val(g).trigger('change').css('background-color','yellow'))})})();
```

- Searches and replaces ASCII punctuation symbols for all title input fields by their preferred Unicode counterparts.
  These can only be guessed based on context as the ASCII symbols are ambiguous.
- Highlights all updated input fields in order to allow the user to review the changes.
- Works for release/medium/track titles (in the release editor) and for recording/work titles (on their respective edit pages).
