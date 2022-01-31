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

	const productionMatch = line.match(/^(\D+?)(?:\s+(\d{4}))?$/);
	if (productionMatch) {
		broadcasters.push(...productionMatch[1].split(/\s+\/\s+/));
		productionYear = productionMatch[2];
	}

	const broadcastMatch = line.match(/^Erstsendung:\s+(\d{2}\.\d{2}\.\d{4})\s+\|\s+(\d+'\d{2})$/);
	if (broadcastMatch) {
		date = zipObject(['day', 'month', 'year'], broadcastMatch[1].split('.'));
		duration = broadcastMatch[2].replace("'", ':');
	}
});

// parse and standardize the title
let episodeTitle = title;
let standardizedFullTitle = title;
let disambiguationComment;

if (title.startsWith(seriesTitle)) {
	const episodeMatch = title.match(/\((?:(\d+)\.\s+(Folge|Teil)(?:\s+\((.+?)\))?:\s+)?(.+?)\)$/);
	if (episodeMatch) {
		episodeTitle = episodeMatch[4];
		disambiguationComment = episodeMatch[3];
		standardizedFullTitle = seriesTitle;

		const episodeNumber = episodeMatch[1];
		if (episodeNumber) {
			standardizedFullTitle += `, ${episodeMatch[2]} ${episodeNumber}`;
		}

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
			name: episodeTitle,
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
