import { urlTypeIds } from '../data/release.js';
import { buildEditNote } from '../editNote.js';
import { createMBIDInput } from '../inputMBID.js';
import { loadCachedEntitiesForRelease, nameToMBIDCache } from '../nameToMBIDCache.js';
import { createReleaseSeederForm } from '../seeding.js';
import { createElement, injectStylesheet } from '@kellnerd/es-utils/dom/create.js';
import { qs, qsa } from '@kellnerd/es-utils/dom/select.js';
import { zipObject } from '@kellnerd/es-utils/object/zipObject.js';

const releaseURL = new URL(window.location);

// extract data
const authors = Array.from(qsa('a[data-id="autor"]')).map((a) => a.textContent.trim());
const title = qs('.ti').textContent.trim();
/* Unused variables (from the previous website version)
const subtitle = qs('.hspunti')?.textContent.trim();
const seriesTitle = qs('strong').nextSibling.nextSibling.textContent.trim();

const productionCredits = Array.from(qsa('.columns > .column > p > span.prefix')).map((span) => {
	const line = span.textContent.trim() + ' ' + span.nextSibling.textContent.trim();
	return line.split(/:\s+/, 2); // split prefix (attribute name) and content (attribute values)
});
*/
const voiceActorCredits = Array.from(qsa('.resultSubTable tr')).map((row) => {
	// three cells which should contain: 1. actor/actress, 2. empty, 3. role(s) or empty
	const cells = row.childNodes;
	if (cells.length !== 3 || cells[0].nodeName !== 'TD') return; // skip headers and empty rows
	return Array.from(cells).map((cell) => cell.textContent.trim()).filter((text) => text);
}).filter((credit) => credit);

// only grab the list after "Produktions- und Sendedaten"
const sidebarText = Array.from(qsa('.frame-space-after-medium > ul:first-of-type > li'))
	.map((p) => p.textContent.trim());

let broadcasters = [], productionYear, radioEvents = [], duration = '';

sidebarText.forEach((line) => {
	// line format: `<broadcaster> <YYYY>`, year is optional
	const productionMatch = line.match(/^(\D+?)(?:\s+(\d{4}))?$/);
	if (productionMatch) {
		broadcasters.push(...productionMatch[1].split(/\s+\/\s+/));
		productionYear = productionMatch[2];
	}

	// line format: `(Deutsche) Erstsendung: <DD.MM.YYYY> | <station> | (ca.) <m'ss>`;
	// parts in parentheses, station and duration are optional
	if (/Erstsendung/.test(line)) {
		const event = {};
		line.split('|').forEach((fragment, column) => {
			const dateMatch = fragment.match(/\d{2}\.\d{2}\.\d{4}/);
			const durationMatch = fragment.match(/\d+'\d{2}/);
			if (dateMatch) {
				event.date = zipObject(['day', 'month', 'year'], dateMatch[0].split('.'));
			} else if (durationMatch) {
				duration = durationMatch[0].replace("'", ':');
			} else if (column === 1) {
				event.station = fragment.trim();
			}
		});
		radioEvents.push(event);
	}
});

// parse and standardize the title
let episodeTitle = title;
let standardizedFullTitle = title;
let disambiguationComment;

const episodeMatch = title.match(/(.+?)\s+\((?:(\d+)\.\s+(Folge|Teil)(?:\s+\((.+?)\))?(?::\s+)?)?(.*)?\)$/);
if (episodeMatch) {
	standardizedFullTitle = episodeMatch[1]; // main title or series title

	const episodeNumber = episodeMatch[2];
	if (episodeNumber) {
		standardizedFullTitle += `, ${episodeMatch[3]} ${episodeNumber}`;
	}

	disambiguationComment = episodeMatch[4];
	episodeTitle = episodeMatch[5];
	if (episodeTitle) {
		standardizedFullTitle += ': ' + episodeTitle;
	}
}

/** @type {MB.ReleaseSeed} */
const release = {
	name: standardizedFullTitle,
	artist_credit: {
		names: authors.map((author, index) => ({
			name: author,
			artist: {
				name: author,
			},
			join_phrase: index === authors.length - 1 ? '' : ', ',
		})),
	},
	type: ['Broadcast', 'Audio drama'],
	events: radioEvents.map(makeReleaseEvent),
	labels: broadcasters.map((name) => ({ name })),
	language: 'deu',
	script: 'Latn',
	status: 'Official',
	barcode: 'none',
	packaging: 'None',
	mediums: [{
		format: 'Digital Media',
		track: [{
			number: 1,
			name: episodeTitle ?? standardizedFullTitle,
			length: duration,
		}],
	}],
	urls: [{
		url: releaseURL.href,
		link_type: urlTypeIds['discography entry'],
	}],
	edit_note: buildEditNote(`Imported radio drama from ${releaseURL}`),
};

if (disambiguationComment) release.comment = disambiguationComment;

/**
 * @param {Object} radioEvent
 * @param {PartialDateT} radioEvent.date
 * @param {string} radioEvent.station
 */
function makeReleaseEvent(radioEvent) {
	return {
		date: radioEvent.date,
		country: getCountryOfStation(radioEvent.station),
	};
}

// TODO: find a list of all stations used by dra.de and improve (AT/CH/DD/LI?)
function getCountryOfStation(station) {
	if (/\bORF\b|Ö\d/.test(station)) return 'AT';
	else if (/\bSRF\b/.test(station)) return 'CH';
	else return 'DE';
}

/** @param {MB.ReleaseSeed} release */
async function injectUI(release) {
	// load the MBIDs for all cached entity names
	nameToMBIDCache.load();
	const relatedEntities = await loadCachedEntitiesForRelease(release);

	// create a table where the user can enter entity name to MBID mappings
	const entityMappings = createElement(`<table id="mbid-mapping"><caption>MusicBrainz Mapping</caption></table>`);
	relatedEntities.forEach((entity, index) => {
		const id = `mbid-mapping-${index}`;
		const tr = createElement(`<tr><td>${entity.name}</td></tr>`);
		const td = document.createElement('td');

		let initialMappingValue;
		if (entity.mbid) {
			initialMappingValue = [entity.type, entity.mbid].join('/');
		}

		const mbidInput = createMBIDInput(id, [entity.type], initialMappingValue);
		td.appendChild(mbidInput);
		tr.appendChild(td);
		entityMappings.appendChild(tr);

		// update cache and importer form if the user pasted an MBID mapping
		mbidInput.addEventListener('mbid-input', async (event) => {
			const mbid = event.detail.id;
			nameToMBIDCache.set([entity.type, entity.name], mbid);
			nameToMBIDCache.store();
			await loadCachedEntitiesForRelease(release);
			injectImporterForm();
		});
	});

	// inject into the sidebar after the image
	const importerContainer = createElement('<p id="mb-importer"></p>');
	const insertAfter = qs('.frame-space-after-medium figure');
	insertAfter.after(importerContainer);
	importerContainer.prepend(entityMappings);
	injectImporterForm();

	// inject a button to copy credits
	/** @type {HTMLButtonElement} */
	const copyButton = createElement('<button type="button" title="Copy voice actor credits to clipboard">Copy credits</button>');
	copyButton.addEventListener('click', () => {
		navigator.clipboard?.writeText(voiceActorCredits.map((credit) => `${credit[1] ?? ''} - ${credit[0]}`).join('\n'));
	});
	copyButton.style.marginTop = '5px';
	importerContainer.appendChild(copyButton);

	function injectImporterForm() {
		const form = createReleaseSeederForm(release);
		const existingForm = qs(`form[name="${form.getAttribute('name')}"]`);

		if (existingForm) {
			existingForm.replaceWith(form);
		} else {
			importerContainer.appendChild(form);
		}
	}
}

const styles = `
input.error {
	background: #EBB1BA !important;
}
input.success {
	background: #B1EBB0;
}
#mb-importer button > img {
	display: inline;
	vertical-align: middle;
	margin-right: 5px;
}
#mbid-mapping caption {
	font-weight: bold;
}`;

injectUI(release);
injectStylesheet(styles, 'musicbrainz-importer');
