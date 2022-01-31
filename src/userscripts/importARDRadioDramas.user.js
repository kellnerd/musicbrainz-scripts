import { urlTypeIds } from '../data/release.js';
import { buildEditNote } from '../editNote.js';
import { qs, qsa } from '../../utils/dom/select.js';
import { flatten } from '../../utils/object/flatten.js';
import { zipObject } from '../../utils/object/zipObject.js';

// clean up the release URL
const releaseURL = new URL(window.location);
const releaseId = releaseURL.searchParams.get('dukey');
releaseURL.search = new URLSearchParams({ dukey: releaseId });

// extract data
const author = qs('.hspaut').textContent.trim();
const title = qs('.hsprhti').textContent.trim();
const seriesTitle = qs('.hsprti')?.textContent.trim();

const productionCredits = Array.from(qsa('.vollinfoblock p > span.prefix')).map((span) => {
	const line = span.parentNode.textContent.trim();
	return line.split(/:\s+/, 2); // split prefix (attribute name) and content (attribute values)
});

const voiceActorCredits = Array.from(document.querySelectorAll('.mitwirkende tr')).map((row) => {
	// three cells which should contain: 1. actor/actress, 2. empty, 3. role(s) or empty
	const cells = row.childNodes;
	if (cells.length !== 3 || cells[0].nodeName !== 'TD') return; // skip headers and empty rows
	return Array.from(cells).map((cell) => cell.textContent.trim()).filter((text) => text);
}).filter((credit) => credit);

const sidebarText = Array.from(qsa('.sectionC div:not(.noPrint) > p')).map((p) => p.textContent.trim());
let broadcasters = [], productionYear, date = {}, duration;

sidebarText.forEach((line) => {
	if (line === 'PRODUKTIONS- UND SENDEDATEN') return;

	const productionMatch = line.match(/^(.+?)\s+(\d{4})$/);
	if (productionMatch) {
		broadcasters.push(productionMatch[1]);
		productionYear = productionMatch[2];
	}

	const broadcastMatch = line.match(/^Erstsendung:\s+(\d{2}\.\d{2}\.\d{4})\s+\|\s+(\d+'\d{2})$/);
	if (broadcastMatch) {
		date = zipObject(['day', 'month', 'year'], broadcastMatch[1].split('.'));
		duration = broadcastMatch[2].replace("'", ':');
	}
});

/** @type {MB.ReleaseSeed} */
const release = {
	name: title,
	artist_credit: {
		names: [{
			name: author,
			artist: {
				name: author,
			},
		}],
	},
	type: ['Broadcast', 'Audio drama'],
	events: [{
		country: 'DE',
		date,
	}],
	labels: broadcasters.map((name) => ({ name })),
	language: 'deu',
	script: 'Latn',
	status: 'official',
	barcode: 'none',
	packaging: 'None',
	mediums: [{
		track: [{
			number: 1,
			name: title,
			length: duration,
		}],
	}],
	urls: [{
		url: releaseURL.href,
		link_type: urlTypeIds['discography entry'],
	}],
	edit_note: buildEditNote(`Imported radio drama from ${releaseURL}`),
};

const releaseSeed = flatten(release, ['type']);
console.log(releaseSeed);
