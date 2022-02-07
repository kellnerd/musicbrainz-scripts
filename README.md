# musicbrainz-bookmarklets

**[Bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet) and [Userscripts](https://en.wikipedia.org/wiki/Userscript) for [MusicBrainz.org](https://musicbrainz.org)**

In order to use one of the **bookmarklets** you have to save the compressed code snippet from the respective section below as a bookmark. Make sure to add the bookmark to a toolbar of your browser which you can easily access while you are editing on MusicBrainz.

While bookmarklets are good for trying things out because they do not require additional software to be installed, **userscripts** are more convenient if you need a snippet frequently. In case you have installed a userscript manager browser extension you can simply install userscripts from this page by clicking the *Install* button. Another benefit of them is that you will receive automatic updates if your userscript manager is configured accordingly.

## Bookmarklets & Userscripts

### [Annotation Converter](src/annotationConverter.js)

```js
javascript:((a,e)=>{const t="background-color";$("textarea[name$=text],textarea[name$=description],textarea[name$=biography]").css(t,"").each((a,n)=>{let r=n.value;r&&(r=((a,e)=>(e.forEach(([e,t])=>{a=a.replace(e,t)}),a))(r,e),r!=n.value&&$(n).val(r).trigger("change").css(t,"yellow"))})})(0,[[/\[(.+?)\]\((.+?)\)/g,"[$2|$1]"],[/(?<!\[)(https?:\/\/\S+)/g,"[$1]"],[/\[(.+?)(\|.+?)?\]/g,(a,e,t="")=>`[${btoa(e)}${t}]`],[/(__|\*\*)(?=\S)(.+?)(?<=\S)\1/g,"'''$2'''"],[/(_|\*)(?=\S)(.+?)(?<=\S)\1/g,"''$2''"],[/^\# +(.+?)( +\#*)?$/gm,"= $1 ="],[/^\#{2} +(.+?)( +\#*)?$/gm,"== $1 =="],[/^\#{3} +(.+?)( +\#*)?$/gm,"=== $1 ==="],[/^(\d+)\. +/gm,"    $1. "],[/^[-+*] +/gm,"    * "],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(a,e,t="")=>`[${atob(e)}${t}]`]]),void $("textarea[name$=text],textarea[name$=description],textarea[name$=biography]").each(async(a,e)=>{e.disabled=!0;let t=await(n=e.value,(async(a,e,t)=>{const $=[];a.replace(e,(a,...e)=>{const t=((a,e,t)=>(async(a,e)=>{if(a.includes("musicbrainz.org")){const t=new URL(a),[$,n,r]=t.pathname.match(/^\/(.+?)\/([0-9a-f-]{36})$/)||[];if($)return e||(e=await(async a=>{a.pathname="/ws/2"+a.pathname,a.search="?fmt=json";let e=await fetch(a);return e=await e.json(),e.name||e.title})(t)),`[${n}:${r}|${e}]`}return((a,e)=>e?`[${a}|${e}]`:`[${a}]`)(a,e)})(e,t))(a,...e);$.push(t)});const n=await Promise.all($);return a.replace(e,()=>n.shift())})(n,/\[(.+?)(?:\|(.+?))?\]/g));var n;t!=e.value&&$(e).val(t),e.disabled=!1});
```

- Allows entity annotations to be (partly) written in basic Markdown and converts them into valid annotation markup.
- Shortens absolute URLs to MusicBrainz entities to `[entity-type:mbid|label]` links.
- Automatically fetches and uses the name of the linked entity as label if none was given.
- Also supports collection descriptions and user profile biographies.

### [Batch Add Parts Of Series](src/bookmarklets/batchAddPartsOfSeries.js)

```js
javascript:(()=>{async function t(t){const e=await fetch("/ws/js/entity/"+t);return MB.entity(await e.json())}function e(t){const e=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor;return new MB.relationshipEditor.UI.AddDialog({viewModel:e,source:e.source,target:t})}const a=prompt("MBIDs of entities which should be added as parts of the series:");a&&(async a=>{for(let i of a){const a=await t(i),o=e(a),s=a.name.match(/\d+/);s&&o.relationship().setAttributes([{type:{gid:"a59c5830-5ec7-38fe-9a21-c7ea54f6650a"},text_value:s[0]}]),o.accept()}})(Array.from(a.matchAll(/[0-9a-f-]{36}/gm),t=>t[0]))})();
```

- Batch-adds entities as parts of the currently edited series.
- Automatically extracts numbers from titles and uses them as relationship attributes.

### [Change All Release Dates](src/changeAllReleaseDates.js)

```js
javascript:(()=>{function e(e,t){$("input.partial-date-"+e).val(t).trigger("change")}const t=prompt("Date for all release events (YYYY-MM-DD):");if(null!==t){const[,a,n,l]=/(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(t)||[];((t,a,n)=>{e("year",t),e("month",a),e("day",n)})(a,n,l)}})();
```

- Changes the date for all release events of a release according to the user's input.
- Useful to correct the dates for digital media releases with lots of release events which are using the wrong first
  release date of the release group.

### [Clear Redundant Medium Titles](src/bookmarklets/clearRedundantMediumTitles.js)

```js
javascript:$("input[id^=medium-title]").val((e,t)=>t.replace(/^(Cassette|CD|Dis[ck]|DVD|SACD|Vinyl)\s*\d+/i,"").trim()).trigger("change"),void $("#edit-note-text").val((e,t)=>"Clear redundant medium titles, see https://musicbrainz.org/doc/Style/Release#Medium_title\n"+t).trigger("change");
```

- Clears medium titles if they are redundant and contain only the medium format and position.
- Adds a link to the relevant guideline to the edit note.

### [Enumerate Track Titles](src/enumerateTrackTitles.js)

```js
javascript:(()=>{const e=prompt("Numbering prefix, preceded by flags:\n+ append to current titles\n_ pad numbers","Part ");if(null!==e){let[,t,n]=e.match(/^([+_]*)(.*)/);t={append:t.includes("+"),padNumbers:t.includes("_")},((e="",t={})=>{let n=$("input.track-name");const r=n.length.toString().length,a=new Intl.NumberFormat("en",{minimumIntegerDigits:r});n.each((n,r)=>{let l=n+1;t.padNumbers&&(l=a.format(l));let p=e+l;t.append&&(p=(r.value+p).replace(/([.!?]),/,"$1")),$(r).val(p)}).trigger("change")})(n,t)}})();
```

- Renames all tracks using their absolute track number and a customizable prefix (which can be empty).
- Useful to number the parts of an audiobook without chapters and other releases with untitled tracks.
- Asks the user to input a numbering prefix which can optionally be preceded by flags:
  - Append the number (including the given prefix) to the current titles: `+`
  - Pad numbers with leading zeros to the same length: `_`
  - *Example*: `+_, Part ` renames track 27/143 "Title" to "Title, Part 027"

### [Expand Collapsed Mediums](src/expandCollapsedMediums.js)

```js
javascript:void $(".expand-medium").trigger("click");
```

- Expands all collapsed mediums in the release editor, useful for large releases.

### [Guess Series Relationship](src/bookmarklets/guessSeriesRelationship.js)

```js
javascript:void(async e=>{const t=document.querySelector("h1 bdi").textContent.match(/(.+?)(?: (\d+))?:/);if(!t)return;const o=(e=>{const t=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor;return new MB.relationshipEditor.UI.AddDialog({viewModel:t,source:t.source,target:e})})(MB.entity({name:t[1]},"series")),i=t[2];i&&o.relationship().setAttributes([{type:{gid:"a59c5830-5ec7-38fe-9a21-c7ea54f6650a"},text_value:i}]),((e,t)=>{e.open(void 0),e.autocomplete.$input.focus(),e.autocomplete.search()})(o)})();
```

- Guesses the series name from the name of the currently edited entity and adds a relationship.
- Tries to extract the series number from the entity name to use it as relationship attribute.

### [Guess Unicode Punctuation](src/guessUnicodePunctuation.js)

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/guessUnicodePunctuation.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/guessUnicodePunctuation.user.js)

```js
javascript:(()=>{function e(e,t){const a="background-color";$(e).css(a,"").each((e,n)=>{let g=n.value;g&&(g=((e,t)=>(t.forEach(([t,a])=>{e=e.replace(t,a)}),e))(g,t),g!=n.value&&$(n).val(g).trigger("change").css(a,"yellow"))})}const t=[[/(?<=[^\p{L}\d]|^)"(.+?)"(?=[^\p{L}\d]|$)/gu,"\u201c$1\u201d"],[/(?<=\W|^)'(n)'(?=\W|$)/gi,"\u2019$1\u2019"],[/(?<=[^\p{L}\d]|^)'(.+?)'(?=[^\p{L}\d]|$)/gu,"\u2018$1\u2019"],[/(\d+)"/g,"$1\u2033"],[/(\d+)'(\d+)/g,"$1\u2032$2"],[/'/g,"\u2019"],[/(?<!\.)\.{3}(?!\.)/g,"\u2026"],[/ - /g," \u2013 "],[/\d{4}-\d{2}(?:-\d{2})?(?=\W|$)/g,e=>Number.isNaN(Date.parse(e))?e:e.replaceAll("-","\u2010")],[/\d+(-\d+){2,}/g,e=>e.replaceAll("-","\u2012")],[/(\d+)-(\d+)/g,"$1\u2013$2"],[/(?<=\S)-(?=\S)/g,"\u2010"]],a=[[/\[(.+?)(\|.+?)?\]/g,(e,t,a="")=>`[${btoa(t)}${a}]`],[/(?<=\/\/)(\S+)/g,(e,t)=>btoa(t)],[/'''/g,"<b>"],[/''/g,"<i>"],...t,[/<b>/g,"'''"],[/<i>/g,"''"],[/(?<=\/\/)([A-Za-z0-9+/=]+)/g,(e,t)=>atob(t)],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(e,t,a="")=>`[${atob(t)}${a}]`]];e("input#name,input#comment,input.track-name,input[id^=medium-title],input[name$=name],input[name$=comment]",t),e("#annotation,#edit-note-text,textarea[name$=text],.edit-note",a)})();
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
javascript:(()=>{const a=location.pathname.match(/release\/([0-9a-f-]{36})/)?.[1];(a=>{a&&open("https://magicisrc.kepstin.ca?mbid="+a)})(a)})();
```

- Opens [kepstin’s MagicISRC](https://magicisrc.kepstin.ca) and loads the currently visited MusicBrainz release.

### [Parse Copyright Notice](src/parseCopyrightNotice.js)

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/parseCopyrightNotice.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/parseCopyrightNotice.user.js)

```js
javascript:(()=>{function e(e,t){return t.forEach(([t,s])=>{e=e.replace(t,s)}),e}const t=/([\xa9\u2117](?:\s*[&+]?\s*[\xa9\u2117])?)(?:.+?;)?\s*(\d{4}(?:\s*[,&]\s*\d{4})*)?(?:[^,.]*\sby)?\s+/,s=/((?:(?:licen[sc]ed?\s(?:to|from)|(?:distributed|marketed)(?:\sby)?)(?:\sand)?\s)+)/,r={nameRE:/.+?(?:,?\s(?:LLC|LLP|(?:Inc|Ltd)\.?|(?:\p{Letter}\.){2,}))?/,nameSeparatorRE:/[/|](?=\s|\w{2})|\s[\u2013-]\s/,terminatorRE:/$|(?=,|\.(?:\W|$)|\sunder\s)|(?<=\.)\W/};function a(t){return e(t.toLowerCase().trim(),[[/licen[sc]ed?/g,"licensed"],[/(distributed|marketed)(\sby)?/,"$1 by"]])}const n={release:{artist:{"\xa9":709,"\u2117":710},label:{"\xa9":708,"\u2117":711,"licensed from":712,"licensed to":833,"distributed by":361,"marketed by":848}},recording:{artist:{"\u2117":869},label:{"\u2117":867}}};function o(e){const t=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor;return new MB.relationshipEditor.UI.AddDialog({viewModel:t,source:t.source,target:e})}function i(e){return new Promise(t=>{e?e.$dialog.on("dialogclose",()=>{t()}):t()})}function c(e,t){e.open(t),e.autocomplete.$input.focus(),e.autocomplete.search()}const d=prompt("Copyright notice:");d&&(async e=>{for(const t of e){const e="label",s=n.release[e],r=MB.entity({name:t.name,entityType:e});for(const e of t.types){const a=o(r),n=a.relationship();n.linkTypeID(s[e]),n.entity0_credit(t.name),t.year&&!Array.isArray(t.year)&&(n.begin_date.year(t.year),n.end_date.year(t.year)),c(a),await i(a)}}})(((n,o={})=>{const i={...r,...o},c=[],d=i.nameRE.source,l=i.terminatorRE.source,m=(n=e(n,[[/\(C\)/gi,"\xa9"],[/\(P\)/gi,"\u2117"],[/\xab(.+?)\xbb/g,"$1"],[/for (.+?) and (.+?) for the world outside (?:of )?\1/g,"/ $2"],[/\u2117\s*(under\s)/gi,"$1"],[/(?<=\u2117\s*)digital remaster/gi,""],[/([\xa9\u2117]\s*\d{4})\s*[&+]?\s*([\xa9\u2117]\s*\d{4})(.+)$/g,"$1$3\n$2$3"]])).matchAll(RegExp(String.raw`${t.source}(?:\s*[–-]\s+)?(${d}(?:\s*/\s*${d})*)(?:${l})`,"gmu"));for(const e of m){const t=e[3].split(i.nameSeparatorRE).map(e=>e.trim()),s=e[1].split(/[&+]|(?<=[\xa9\u2117])\s*(?=[\xa9\u2117])/).map(a),r=e[2]?.split(/[,&]/).map(e=>e.trim());t.forEach(e=>{var t;/an?\s(.+?)\srelease/i.test(e)||c.push({name:e,types:s,year:(t=r,Array.isArray(t)&&1===t.length?t[0]:t)})})}const p=n.matchAll(RegExp(String.raw`${s.source}(?:\s*[–-]\s+)?(${d})(?:${l})`,"gimu"));for(const e of p){const t=e[1].split(/\sand\s/).map(a);c.push({name:e[2],types:t})}return Array.from(new Map(c.map(e=>[JSON.stringify(e),e])).values())})(d))})();
```

- Extracts all copyright and legal information from the given text.
- Automates the process of creating release-label relationships for these.
- Also creates phonographic copyright relationships for all selected recordings (userscript only).
- Detects artists who own the copyright of their own release and adds artist relationships for these (userscript only).
- See the [wiki page](https://github.com/kellnerd/musicbrainz-bookmarklets/wiki/Parse-Copyright-Notices) for more details.

### [Relate This Entity To Multiple MBIDs](src/bookmarklets/relateThisEntityToMultipleMBIDs.js)

```js
javascript:(()=>{async function t(t){const e=await fetch("/ws/js/entity/"+t);return MB.entity(await e.json())}function e(t){const e=MB.sourceRelationshipEditor??MB.releaseRelationshipEditor;return new MB.relationshipEditor.UI.AddDialog({viewModel:e,source:e.source,target:t})}const i=prompt("MBIDs of entities which should be related to this entity:");i&&(async(i,o,n=!1)=>{for(let a of i){const i=e(await t(a));o&&(i.relationship().linkTypeID(o),n&&i.changeDirection()),i.accept()}})(Array.from(i.matchAll(/[0-9a-f-]{36}/gm),t=>t[0]))})();
```

- Relates the currently edited entity to multiple entities given by their MBIDs.
- Automatically uses the default relationship type between the two entity types.

### [Show Qobuz Release Availability](src/bookmarklets/showQobuzReleaseAvailability.js)

```js
javascript:(()=>{const e=Array.from(document.querySelectorAll("head > link[rel=alternate]")).map(e=>e.hreflang).map(e=>e.split("-")[1]).filter((e,l,r)=>e&&r.indexOf(e)===l);alert(`Available in ${e.length} countries\n${e.sort().join(", ")}`)})();
```

- Shows all countries in which the currently visited Qobuz release is available.

### [View Discogs Entity Via API](src/bookmarklets/viewDiscogsEntityViaAPI.js)

```js
javascript:(()=>{const s=window.location.href.match(/(artist|label|master|release)\/(\d+)/)?.slice(1);s&&open(((s,e)=>`https://api.discogs.com/${s}s/${e}`)(...s))})();
```

- Views the API response for the currently visited Discogs entity (in a new tab).

### [Voice Actor Credits](src/voiceActorCredits.js)

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/voiceActorCredits.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/voiceActorCredits.user.js)

```js
javascript:void((e={},t="",i="")=>{const r=MB.releaseRelationshipEditor,a=MB.entity(e,"artist"),d=new MB.relationshipEditor.UI.AddDialog({source:r.source,target:a,viewModel:r}),o=d.relationship();return o.linkTypeID(60),o.entity0_credit(i),o.setAttributes([{type:{gid:"d3a36e62-a7c4-4eb9-839f-adfebe87ac12"},credited_as:t}]),d})().open();
```

- Simplifies the addition of “spoken vocals” relationships (at release level) by providing a pre-filled dialogue in the relationship editor.
- Imports voice actor credits from linked Discogs pages (userscript only).
- Automatically matches artists whose Discogs pages are linked to MB (unlinked artists can be selected from the already opened inline search).

## Development

Running `npm run build` compiles [all userscripts](src/userscripts/) and [all bookmarklets](src/bookmarklets/) before it generates an updated version of `README.md`. Before you can run this command you have to ensure that you have setup [Node.js](https://nodejs.org/) and have installed the dependencies of the build script via `npm install`.

If you want to compile a single minified bookmarklet from a module or a standalone JavaScript file you can run `node tools/bookmarkletify.js file.js`. The result will be output directly on screen and no files will be modified.
