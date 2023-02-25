import { urlTypeIds } from '../data/release.js';
import { buildEditNote } from '../editNote.js';
import { injectStylesheet } from '../../utils/dom/create.js';
import { qs, qsa } from '../../utils/dom/select.js';
import { zipObject } from '../../utils/object/zipObject.js';
import {
	buildCopyCreditsButton,
	injectImporterStyle,
	injectImporterUI,
} from '../importerUI.js';

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

const voiceActorCredits = Array.from(qsa('.mitwirkende tr')).map((row) => {
	// three cells which should contain: 1. actor/actress, 2. empty, 3. role(s) or empty
	const cells = row.childNodes;
	if (cells.length !== 3 || cells[0].nodeName !== 'TD') return; // skip headers and empty rows
	return Array.from(cells).map((cell) => cell.textContent.trim()).filter((text) => text);
}).filter((credit) => credit);

const sidebarText = Array.from(qsa('.sectionC div:not(.noPrint) > p'))
	.filter((p) => p.childElementCount === 0) // skip headings, keep only text nodes
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

const additionalStyles = `
#mbid-mapping {
	border-spacing: revert;
	margin-bottom: 1em;
}
#mbid-mapping caption {
	text-transform: uppercase;
}`;

// inject into an empty sidebar section
const importerContainer = qs('.sectionC .noPrint > p');
injectImporterUI(release, importerContainer).then(() => {
	importerContainer.appendChild(buildCopyCreditsButton(voiceActorCredits));
});
injectImporterStyle();
injectStylesheet(additionalStyles, 'dra-importer');
