import { urlTypeIds } from '../data/release.js';
import { buildEditNote } from '../editNote.js';
import { createReleaseSeederForm } from '../seeding.js';
import { qs, qsa } from '../../utils/dom/select.js';
import { zipObject } from '../../utils/object/zipObject.js';

// clean up the release URL
const releaseURL = new URL(window.location);
const releaseId = releaseURL.searchParams.get('dukey');
releaseURL.search = new URLSearchParams({ dukey: releaseId });

// extract data
const authors = Array.from(qsa('.hspaut a')).map((a) => a.textContent.trim());
const title = qs('.hsprhti').textContent.trim();
const subtitle = qs('.hspunti')?.textContent.trim();
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

const sidebarText = Array.from(qsa('.sectionC div:not(.noPrint) > p'))
	.filter((p) => p.childElementCount === 0) // skip headings, keep only text nodes
	.map((p) => p.textContent.trim());

let broadcasters = [], productionYear, date = {}, station, duration;

sidebarText.forEach((line) => {
	const productionMatch = line.match(/^(\D+?)(?:\s+(\d{4}))?$/);
	if (productionMatch) {
		broadcasters.push(...productionMatch[1].split(/\s+\/\s+/));
		productionYear = productionMatch[2];
	}

	const broadcastMatch = line.match(/^Erstsendung:\s+(\d{2}\.\d{2}\.\d{4})\s+\|\s+(?:(.+?)\s+\|\s+)?(\d+'\d{2})$/);
	if (broadcastMatch) {
		date = zipObject(['day', 'month', 'year'], broadcastMatch[1].split('.'));
		station = broadcastMatch[2];
		duration = broadcastMatch[3].replace("'", ':');

		if (station) {
			broadcasters.push(station);
		}
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
	events: [{
		country: 'DE',
		date,
	}],
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

const form = createReleaseSeederForm(release);
qs('.sectionC .noPrint > p').prepend(form);
