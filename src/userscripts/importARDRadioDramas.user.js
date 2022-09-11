import { urlTypeIds } from '../data/release.js';
import { buildEditNote } from '../editNote.js';
import { createMBIDInput } from '../inputMBID.js';
import { loadCachedEntitiesForRelease, nameToMBIDCache } from '../nameToMBIDCache.js';
import { createReleaseSeederForm } from '../seeding.js';
import { createElement, injectStylesheet } from '../../utils/dom/create.js';
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

const voiceActorCredits = Array.from(qsa('.mitwirkende tr')).map((row) => {
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


/** @param {MB.ReleaseSeed} release */
async function injectUI(release) {
	// load the MBIDs for all cached entity names
	nameToMBIDCache.load();
	const relatedEntities = await loadCachedEntitiesForRelease(release);

	// create a table where the user can enter entity name to MBID mappings
	const entityMappings = createElement(`<table id="mbid-mapping"><caption>MUSICBRAINZ MAPPING</caption></table>`);
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

	// inject into an empty sidebar section
	const importerContainer = qs('.sectionC .noPrint > p');
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
form[name="musicbrainz-release-seeder"] button img {
	display: inline;
	vertical-align: middle;
	margin-right: 5px;
}
#mbid-mapping {
	border-spacing: revert;
}
#mbid-mapping caption {
	font-weight: bold;
}`;

injectUI(release);
injectStylesheet(styles, 'musicbrainz-importer');
