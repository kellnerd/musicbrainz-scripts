import { urlTypeIds } from '../data/release.js';
import { buildEditNote } from '../editNote.js';
import {
	injectImporterStyle,
	injectImporterUI,
} from '../importerUI.js';
import { toPartialDate } from '../partialDates.js';
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

const currentPath = window.location.pathname;
const episodeId = currentPath.match(/^\/episode\/.+\/(\d+)\/?$/)?.[1];

if (episodeId) {
	fetchEpisode(episodeId)
		.then(parseEpisode)
		.then((release) => {
			console.log('Parsed release:', release);

			// inject into the details column on the left
			const importerContainer = qs('section div[class*=DetailsColumn]');
			injectImporterUI(release, importerContainer);
			injectImporterStyle();
		});
}
