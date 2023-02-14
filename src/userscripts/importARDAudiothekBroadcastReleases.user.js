import { urlTypeIds } from '../data/release.js';
import { buildEditNote } from '../editNote.js';
import { createMBIDInput } from '../inputMBID.js';
import { loadCachedEntitiesForRelease, nameToMBIDCache } from '../nameToMBIDCache.js';
import { toPartialDate } from '../partialDates.js';
import { createReleaseSeederForm } from '../seeding.js';
import { createElement, injectStylesheet } from '../../utils/dom/create.js';
import { qs } from '../../utils/dom/select.js';

async function fetchEpisode(id) {
	const response = await fetch('https://api.ardaudiothek.de/items/' + id);
	const json = await response.json();
	return json.data.item; // is `null` for invalid IDs
}

function parseEpisode(episode) {
	const publicationDate = new Date(episode.publicationStartDateAndTime);
	const publicationService = episode.programSet?.publicationService?.title;

	/** @type {MB.ReleaseSeed} */
	const release = {
		name: episode.title,
		artist_credit: {
			names: [{
				// name will be ignored/overwritten if the user provides a mapping to an MBID
				artist: { name: '[unknown]' },
			}],
		},
		type: ['Broadcast'],
		events: [{
			country: 'DE',
			date: toPartialDate(publicationDate),
		}],
		labels: [{
			name: publicationService,
		}],
		language: 'deu',
		script: 'Latn',
		status: 'Official',
		barcode: 'none',
		packaging: 'None',
		mediums: [{
			format: 'Digital Media',
			track: [{
				number: 1,
				name: episode.title,
				length: episode.duration * 1000, // seconds to milliseconds
			}],
		}],
		urls: [{
			url: episode.sharingUrl,
			link_type: urlTypeIds['free streaming'],
		}],
		edit_note: buildEditNote(`Imported release from ${episode.sharingUrl}`),
	};

	const categoryId = episode.programSet?.editorialCategories?.id;
	switch (categoryId) {
		case '42914712': // "Hörspiel"
			release.type.push('Audio drama');
	}

	const audioDownloadUrl = episode.audios?.[0]?.downloadUrl;
	if (audioDownloadUrl) {
		release.urls.push({
			url: episode.sharingUrl,
			link_type: urlTypeIds['download for free'],
		});
	}

	return release;
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

	// inject into the details column
	const importerContainer = qs('section div[class*=DetailsColumn]');
	importerContainer.append(entityMappings);
	injectImporterForm();

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
#mbid-mapping caption {
	font-weight: bold;
}`;

const currentPath = window.location.pathname;
const episodeId = currentPath.match(/^\/episode\/.+\/(\d+)\/?$/)?.[1];

if (episodeId) {
	fetchEpisode(episodeId)
		.then(parseEpisode)
		.then((release) => {
			console.log('Parsed release:', release);
			injectUI(release);
			injectStylesheet(styles, 'musicbrainz-importer');
		});
}
