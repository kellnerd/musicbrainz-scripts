# musicbrainz-scripts

**[Bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet) and [Userscripts](https://en.wikipedia.org/wiki/Userscript) for [MusicBrainz.org](https://musicbrainz.org)**

In order to use one of the **bookmarklets** you have to save the compressed code snippet from the respective section below as a bookmark. Make sure to add the bookmark to a toolbar of your browser which you can easily access while you are editing on MusicBrainz.

While bookmarklets are good for trying things out because they do not require additional software to be installed, **userscripts** are more convenient if you need a snippet frequently. In case you have installed a userscript manager browser extension you can simply install userscripts from this page by clicking the *Install* button. Another benefit of them is that you will receive automatic updates if your userscript manager is configured accordingly.

## Userscripts

### Guess Unicode punctuation

Searches and replaces ASCII punctuation symbols for many input fields by their preferred Unicode counterparts. Provides “Guess punctuation” buttons for titles, names, disambiguation comments, annotations and edit notes on all entity edit and creation pages.
- Guesses Unicode punctuation based on context as the ASCII symbols are ambiguous.
- Highlights all updated input fields in order to allow the user to review the changes.
- Works for release/medium/track titles and release disambiguation comments (in the release editor).
- Also supports other entity names and disambiguation comments (on their respective edit and creation pages).
- Detects the selected language (in the release editor) and uses localized quotes.
- Experimental support for annotations and edit notes. Preserves apostrophe-based markup (bold, italic) and URLs.

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/guessUnicodePunctuation.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/guessUnicodePunctuation.user.js)

Also available as a bookmarklet with less features:

Supports the same fields as the userscript but without language detection and granular control over the affected fields.

```js
javascript:(()=>{function e(e,t){const a="background-color";$(e).css(a,"").each((e,n)=>{let g=n.value;g&&(g=((e,t)=>(t.forEach(([t,a])=>{e=e.replace(t,a)}),e))(g,t),g!=n.value&&$(n).val(g).trigger("change").css(a,"yellow"))})}const t=[[/(?<=[^\p{L}\d]|^)"(.+?)"(?=[^\p{L}\d]|$)/gu,"\u201c$1\u201d"],[/(?<=\W|^)'(n)'(?=\W|$)/gi,"\u2019$1\u2019"],[/(?<=[^\p{L}\d]|^)'(.+?)'(?=[^\p{L}\d]|$)/gu,"\u2018$1\u2019"],[/(\d+)"/g,"$1\u2033"],[/(\d+)'(\d+)/g,"$1\u2032$2"],[/'/g,"\u2019"],[/(?<!\.)\.{3}(?!\.)/g,"\u2026"],[/ - /g," \u2013 "],[/\d{4}-\d{2}(?:-\d{2})?(?=\W|$)/g,e=>Number.isNaN(Date.parse(e))?e:e.replaceAll("-","\u2010")],[/\d+(-\d+){2,}/g,e=>e.replaceAll("-","\u2012")],[/(\d+)-(\d+)/g,"$1\u2013$2"],[/(?<=\S)-(?=\S)/g,"\u2010"]],a=[[/\[(.+?)(\|.+?)?\]/g,(e,t,a="")=>`[${btoa(t)}${a}]`],[/(?<=\/\/)(\S+)/g,(e,t)=>btoa(t)],[/'''/g,"<b>"],[/''/g,"<i>"],...t,[/<b>/g,"'''"],[/<i>/g,"''"],[/(?<=\/\/)([A-Za-z0-9+/=]+)/g,(e,t)=>atob(t)],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(e,t,a="")=>`[${atob(t)}${a}]`]];e("input#name,input#comment,input.track-name,input[id^=medium-title],input[name$=name],input[name$=comment]",t),e("#annotation,#edit-note-text,textarea[name$=text],.edit-note",a)})();
```

### Import ARD radio dramas

Imports German broadcast releases from the ARD radio drama database.
- Adds an import button to the sidebar of detail pages (“Vollinformation”) on https://hoerspiele.dra.de
- Lets the user enter persistent name to MBID mappings for artists and labels
- Provides a button to copy voice actor credits to clipboard (can be pasted into the [credit parser](#voice-actor-credits))

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/importARDRadioDramas.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/importARDRadioDramas.user.js)

### Parse copyright notice

Parses copyright notices and automates the process of creating release and recording relationships for these.
- Extracts all copyright and legal information from the given text.
- Automates the process of creating label-release (or artist-release) relationships for these credits.
- Also creates phonographic copyright relationships for all selected recordings.
- Detects artists who own the copyright of their own release and defaults to adding artist-release relationships for these credits.
- See the [wiki page](https://github.com/kellnerd/musicbrainz-scripts/wiki/Parse-Copyright-Notices) for more details.
- Allows seeding of the credit input (`credits`) and the edit note (`edit-note`) via custom query parameters, which are encoded into the hash of the URL (*Example*: `/edit-relationships#credits=(C)+2023+Test&edit-note=Seeding+example`).

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/parseCopyrightNotice.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/parseCopyrightNotice.user.js)

### Voice actor credits

Parses voice actor credits from text and automates the process of creating release or recording relationships for these. Also imports credits from Discogs.
- Simplifies the addition of “spoken vocals” relationships by providing a pre-filled dialogue in the relationship editor.
- Parses a list of voice actor credits from text and remembers name to MBID mappings.
- Adds relationships to selected recordings, falls back to release relationships (if no recordings are selected).
- Imports voice actor credits from linked Discogs release pages.
- Automatically matches artists whose Discogs pages are linked to MB (unlinked artists can be selected from the already opened inline search).
- Allows seeding of the credit input (`credits`) and the edit note (`edit-note`) via custom query parameters, which are encoded into the hash of the URL (*Example*: `/edit-relationships#credits=Narrator+-+John+Doe&edit-note=Seeding+example`).

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/voiceActorCredits.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/voiceActorCredits.user.js)

## Bookmarklets

### [Annotation Converter](src/annotationConverter.js)

- Allows entity annotations to be (partly) written in basic Markdown and converts them into valid annotation markup.
- Shortens absolute URLs to MusicBrainz entities to `[entity-type:mbid|label]` links.
- Automatically fetches and uses the name of the linked entity as label if none was given.
- Also supports collection descriptions and user profile biographies.

```js
javascript:((a,e)=>{const t="background-color";$("textarea[name$=text],textarea[name$=description],textarea[name$=biography]").css(t,"").each((a,n)=>{let r=n.value;r&&(r=((a,e)=>(e.forEach(([e,t])=>{a=a.replace(e,t)}),a))(r,e),r!=n.value&&$(n).val(r).trigger("change").css(t,"yellow"))})})(0,[[/\[(.+?)\]\((.+?)\)/g,"[$2|$1]"],[/(?<!\[)(https?:\/\/\S+)/g,"[$1]"],[/\[(.+?)(\|.+?)?\]/g,(a,e,t="")=>`[${btoa(e)}${t}]`],[/(__|\*\*)(?=\S)(.+?)(?<=\S)\1/g,"'''$2'''"],[/(_|\*)(?=\S)(.+?)(?<=\S)\1/g,"''$2''"],[/^\# +(.+?)( +\#*)?$/gm,"= $1 ="],[/^\#{2} +(.+?)( +\#*)?$/gm,"== $1 =="],[/^\#{3} +(.+?)( +\#*)?$/gm,"=== $1 ==="],[/^(\d+)\. +/gm,"    $1. "],[/^[-+*] +/gm,"    * "],[/\[([A-Za-z0-9+/=]+)(\|.+?)?\]/g,(a,e,t="")=>`[${atob(e)}${t}]`]]),void $("textarea[name$=text],textarea[name$=description],textarea[name$=biography]").each(async(a,e)=>{e.disabled=!0;let t=await(n=e.value,(async(a,e,t)=>{const $=[];a.replace(e,(a,...e)=>{const t=((a,e,t)=>(async(a,e)=>{if(a.includes("musicbrainz.org")){const t=new URL(a),[$,n,r]=t.pathname.match(/^\/(.+?)\/([0-9a-f-]{36})$/)||[];if($)return e||(e=await(async a=>{a.pathname="/ws/2"+a.pathname,a.search="?fmt=json";let e=await fetch(a);return e=await e.json(),e.name||e.title})(t)),`[${n}:${r}|${e}]`}return((a,e)=>e?`[${a}|${e}]`:`[${a}]`)(a,e)})(e,t))(a,...e);$.push(t)});const n=await Promise.all($);return a.replace(e,()=>n.shift())})(n,/\[(.+?)(?:\|(.+?))?\]/g));var n;t!=e.value&&$(e).val(t),e.disabled=!1});
```

### [Batch Add Parts Of Series](src/bookmarklets/batchAddPartsOfSeries.js)

- Batch-adds release groups as parts of the currently edited series.
- Automatically extracts numbers from titles and uses them as relationship attributes.

```js
javascript:(()=>{async function t(t){return(await fetch("/ws/js/entity/"+t)).json()}const e={_lineage:[],_original:null,_status:1,attributes:null,begin_date:null,editsPending:!1,end_date:null,ended:!1,entity0_credit:"",entity1_credit:"",id:null,linkOrder:0,linkTypeID:null};function i({source:t=MB.relationshipEditor.state.entity,target:i,batchSelectionCount:n=null,...a}){const r=t.entityType>i.entityType;MB.relationshipEditor.dispatch({type:"update-relationship-state",sourceEntity:t,batchSelectionCount:n,creditsToChangeForSource:"",creditsToChangeForTarget:"",newRelationshipState:{...e,entity0:r?i:t,entity1:r?t:i,id:MB.relationshipEditor.getRelationshipStateId(),...a},oldRelationshipState:null})}function n(...t){return MB.tree.fromDistinctAscArray(t.map(t=>{const e=MB.linkedEntities.link_attribute_type[t.type.gid];return{...t,type:e,typeID:e.id}}))}const a=prompt("MBIDs of RGs which should be added as parts of the series:");a&&(async e=>{for(let a of e){const e=await t(a),r=e.name.match(/\d+/)?.[0];i({target:e,linkTypeID:742,attributes:n({type:{gid:"a59c5830-5ec7-38fe-9a21-c7ea54f6650a"},text_value:r??""})})}})(Array.from(a.matchAll(/[0-9a-f-]{36}/gm),t=>t[0]))})();
```

### [Change All Release Dates](src/changeAllReleaseDates.js)

- Changes the date for all release events of a release according to the user's input.
- Useful to correct the dates for digital media releases with lots of release events which are using the wrong first
  release date of the release group.

```js
javascript:(()=>{function e(e,t){$("input.partial-date-"+e).val(t).trigger("change")}const t=prompt("Date for all release events (YYYY-MM-DD):");if(null!==t){const[,a,n,l]=/(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(t)||[];((t,a,n)=>{e("year",t),e("month",a),e("day",n)})(a,n,l)}})();
```

### [Clear Redundant Medium Titles](src/bookmarklets/clearRedundantMediumTitles.js)

- Clears medium titles if they are redundant and contain only the medium format and position.
- Adds a link to the relevant guideline to the edit note.

```js
javascript:(()=>{function e(e,t,i=new Event("change")){e.value=t,e.dispatchEvent(i)}((e,t=document)=>t.querySelectorAll(e))("input[id^=medium-title]").forEach(t=>e(t,t.value.replace(/^(Cassette|CD|Dis[ck]|DVD|SACD|Vinyl)\s*\d+/i,"").trim()));const t=document.getElementById("edit-note-text");e(t,"Clear redundant medium titles, see https://musicbrainz.org/doc/Style/Release#Medium_title\n"+t.value)})();
```

### [Detect Cover Art Types](src/detectCoverArtTypes.js)

- Detects and fills the image types and comment of all pending uploads using their filenames.
- Treats filename parts in parentheses as image comments.

```js
javascript:(()=>{function t(t,e=document){return e.querySelector(t)}function e(t,e=document){return e.querySelectorAll(t)}const n='ul.cover-art-type-checkboxes input[type="checkbox"]';(({additionalTypes:c=[],commentPattern:o}={})=>{const a=e('tbody[data-bind="foreach: files_to_upload"] > tr'),r={};e(n,a[0]).forEach(t=>{t.parentElement.textContent.trim().toLowerCase().split("/").forEach(e=>r[e]=t.value)});const i=RegExp(String.raw`(?<=\W|_|^)(${Object.keys(r).join("|")})(?=\W|_|$)`,"gi");a.forEach(a=>{const l=t('.file-info span[data-bind="text: name"]',a).textContent,s=Array.from(l.matchAll(i),t=>t[0]);if(c&&s.push(...c),s.length&&((t,c=[])=>{e(n,t).forEach(t=>{c.includes(t.value)&&(t.checked=!0,t.dispatchEvent(new Event("click")))})})(a,s.map(t=>r[t.toLowerCase()])),o){const e=l.match(o);e&&((e,n)=>{const c=t("input.comment",e);c.value=n,c.dispatchEvent(new Event("change"))})(a,e[0])}})})({commentPattern:/(?<=\().+?(?=\))/})})();
```

### [Enumerate Track Titles](src/enumerateTrackTitles.js)

- Renames all tracks using their absolute track number and a customizable prefix (which can be empty).
- Useful to number the parts of an audiobook without chapters and other releases with untitled tracks.
- Asks the user to input a numbering prefix which can optionally be preceded by flags:
  - Append the number (including the given prefix) to the current titles: `+`
  - Pad numbers with leading zeros to the same length: `_`
  - *Example*: `+_, Part ` renames track 27/143 "Title" to "Title, Part 027"

```js
javascript:(()=>{const e=prompt("Numbering prefix, preceded by flags:\n+ append to current titles\n_ pad numbers","Part ");if(null!==e){let[,t,n]=e.match(/^([+_]*)(.*)/);t={append:t.includes("+"),padNumbers:t.includes("_")},((e="",t={})=>{let n=$("input.track-name");const r=n.length.toString().length,a=new Intl.NumberFormat("en",{minimumIntegerDigits:r});n.each((n,r)=>{let l=n+1;t.padNumbers&&(l=a.format(l));let p=e+l;t.append&&(p=(r.value+p).replace(/([.!?]),/,"$1")),$(r).val(p)}).trigger("change")})(n,t)}})();
```

### [Expand Collapsed Mediums](src/expandCollapsedMediums.js)

- Expands all collapsed mediums in the release editor, useful for large releases.

```js
javascript:void $(".expand-medium").trigger("click");
```

### [Guess Series Relationship](src/bookmarklets/guessSeriesRelationship.js)

- Guesses the series name from the name of the currently edited entity and adds a relationship.
- Tries to extract the series number from the entity name to use it as relationship attribute.
- Currently limited to release groups, both via their edit pages and via the release relationship editor.

```js
javascript:(()=>{function t(t){return new Promise(e=>setTimeout(e,t))}(async e=>{const i=document.querySelector("h1 bdi").textContent.match(/(.+?)(?: (\d+))?:/);if(!i)return;const a=MB.relationshipEditor.state.entity;(async({source:e=MB.relationshipEditor.state.entity,target:i,targetType:a,linkTypeId:o,attributes:r,batchSelection:s=!1}={})=>{const n="string"==typeof i;var p,c;if(i&&!n&&(a=i.entityType),MB.relationshipEditor.dispatch({type:"update-dialog-location",location:{source:e,batchSelection:s}}),await(p=()=>!!MB.relationshipEditor.relationshipDialogDispatch,new Promise(async e=>{for(;!1===p();)await t(1);e()})),a&&MB.relationshipEditor.relationshipDialogDispatch({type:"update-target-type",source:e,targetType:a}),o){const i=await(async(e,{retries:i=10,wait:a=0}={})=>{do{const i=await e();if(void 0!==i)return i;a&&await t(a)}while(i--)})(()=>MB.relationshipEditor.relationshipDialogState.linkType.autocomplete.items.find(t=>t.id==o),{wait:10});i&&MB.relationshipEditor.relationshipDialogDispatch({type:"update-link-type",source:e,action:{type:"update-autocomplete",source:e,action:{type:"select-item",item:i}}})}r&&(t=>{MB.relationshipEditor.relationshipDialogDispatch({type:"set-attributes",attributes:t})})(r),i&&((n?[{type:"type-value",value:i},{type:"search-after-timeout",searchTerm:i}]:[{type:"select-item",item:(c=i,{type:"option",id:c.id,name:c.name,entity:c})}]).forEach(t=>{MB.relationshipEditor.relationshipDialogDispatch({type:"update-target-entity",source:e,action:{type:"update-autocomplete",source:e,action:t}})}),n&&((t,e=document)=>e.querySelector(t))("input.relationship-target").focus())})({source:a.releaseGroup??a,target:i[1],targetType:"series",linkTypeId:742,attributes:[{type:{gid:"a59c5830-5ec7-38fe-9a21-c7ea54f6650a"},text_value:i[2]}]})})()})();
```

### [Load Release With Magic ISRC](src/bookmarklets/loadReleaseWithMagicISRC.js)

- Opens [kepstin’s MagicISRC](https://magicisrc.kepstin.ca) and loads the currently visited MusicBrainz release.

```js
javascript:(()=>{const a=location.pathname.match(/release\/([0-9a-f-]{36})/)?.[1];(a=>{a&&open("https://magicisrc.kepstin.ca?mbid="+a)})(a)})();
```

### [Mark Release As Worldwide](src/bookmarklets/markReleaseAsWorldwide.js)

- Removes all release events except for the first one and changes its country to [Worldwide].
- Allows to replace an exhaustive list of release countries/events with a single release event.

```js
javascript:$(".remove-release-event:not(:first)").trigger("click"),void $("#country-0").val(240).trigger("change");
```

### [Relate This Entity To Multiple MBID](src/bookmarklets/relateThisEntityToMultipleMBID.js)

- Relates the currently edited entity to multiple entities given by their MBIDs.
- Uses the selected relationship type of the currently active relationship dialog.

```js
javascript:(()=>{async function t(t){return(await fetch("/ws/js/entity/"+t)).json()}const e={_lineage:[],_original:null,_status:1,attributes:null,begin_date:null,editsPending:!1,end_date:null,ended:!1,entity0_credit:"",entity1_credit:"",id:null,linkOrder:0,linkTypeID:null};function i({source:t=MB.relationshipEditor.state.entity,target:i,batchSelectionCount:n=null,...a}){const o=t.entityType>i.entityType;MB.relationshipEditor.dispatch({type:"update-relationship-state",sourceEntity:t,batchSelectionCount:n,creditsToChangeForSource:"",creditsToChangeForTarget:"",newRelationshipState:{...e,entity0:o?i:t,entity1:o?t:i,id:MB.relationshipEditor.getRelationshipStateId(),...a},oldRelationshipState:null})}const n=prompt("MBIDs of entities which should be related to this entity:");if(n){const e=Array.from(n.matchAll(/[0-9a-f-]{36}/gm),t=>t[0]),a=MB.relationshipEditor.relationshipDialogState;a&&(async(e,n,a=!1)=>{for(let o of e)i({target:await t(o),linkTypeID:n,backward:a})})(e,a.linkType.autocomplete.selectedItem.entity.id,a.backward)}})();
```

### [Set Recording Dates](src/bookmarklets/setRecordingDates.js)

- Asks the user for a recording date (or date range) in the release relationship editor.
- Sets the begin and end date for all “recording of” relationships of all selected recordings.

```js
javascript:(()=>{const t=MB.relationshipEditor.state.selectedRecordings;if(t.size){const i=prompt("Begin date and optional end date for all performance relationships (YYYY-MM-DD):");if(null!==i){const n=Array.from(i.matchAll(/\d{4}(?:-\d{1,2}(?:-\d{1,2})?)?/g)),[r,a]=n.map(t=>{return e=["year","month","day"],i=t[0].split("-"),Object.fromEntries(e.map((t,n)=>[e[n],i[n]]));var e,i});for(const i of MB.tree.iterate(t))e(i,r,a)}}function e(t,e,i){t.relationships.filter(t=>278===t.linkTypeID).forEach(n=>{((t,e,i)=>{const n=((t,e)=>({id:e.id,entity0:e.backward?e.target:t,entity1:e.backward?t:e.target,attributes:MB.tree.fromDistinctAscArray(e.attributes),begin_date:e.begin_date,end_date:e.end_date,ended:e.ended,entity0_credit:e.entity0_credit,entity1_credit:e.entity1_credit,linkOrder:e.linkOrder,linkTypeID:e.linkTypeID,editsPending:e.editsPending,_lineage:[],_original:null,_status:0}))(t,e);MB.relationshipEditor.dispatch({type:"update-relationship-state",sourceEntity:t,creditsToChangeForSource:"",creditsToChangeForTarget:"",newRelationshipState:{...n,_status:2,_original:n,...i},oldRelationshipState:n})})(t,n,{begin_date:e,end_date:i??e,ended:!0})})}})();
```

### [Show Qobuz Release Availability](src/bookmarklets/showQobuzReleaseAvailability.js)

- Shows all countries in which the currently visited Qobuz release is available.

```js
javascript:(()=>{const e=Array.from(document.querySelectorAll("head > link[rel=alternate]")).map(e=>e.hreflang).map(e=>e.split("-")[1]).filter((e,l,r)=>e&&r.indexOf(e)===l);alert(`Available in ${e.length} countries\n${e.sort().join(", ")}`)})();
```

### [View Discogs Entity Via API](src/bookmarklets/viewDiscogsEntityViaAPI.js)

- Views the API response for the currently visited Discogs entity (in a new tab).

```js
javascript:(()=>{const s=window.location.href.match(/(artist|label|master|release)\/(\d+)/)?.slice(1);s&&open(((s,e)=>`https://api.discogs.com/${s}s/${e}`)(...s))})();
```

## Development

Running `npm run build` compiles [all userscripts](src/userscripts/) and [all bookmarklets](src/bookmarklets/) before it generates an updated version of `README.md`. Before you can run this command you have to ensure that you have setup [Node.js](https://nodejs.org/) and have installed the dependencies of the build script via `npm install`.

## Node.js Package

Do you want to create your own userscript or bookmarklet project for MusicBrainz without having to rewrite everything from scratch?

Have a look at my [userscript bundler](https://github.com/kellnerd/userscript-bundler) tools which are used to build the userscripts, bookmarklets and the README in this repository.

You can also reuse code from this repository by installing it as a dependency of your own Node.js project:
`npm install kellnerd/musicbrainz-scripts`

The package gives you access to all the MusicBrainz specific modules under [src](src/) except for the main modules of the bookmarklets and userscripts themselves.

The primary entry point of the `@kellnerd/musicbrainz-scripts` package is [index.js](index.js) which provides import shortcuts for stable, potentially useful pieces of code from `src/`.

- Shortcut usage: `import { buildEditNote } from '@kellnerd/musicbrainz-scripts';`

- Full specifier: `import { buildEditNote } from '@kellnerd/musicbrainz-scripts/src/editNote.js';`
