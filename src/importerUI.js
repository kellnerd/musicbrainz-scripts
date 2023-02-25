import { createMBIDInput } from './inputMBID.js';
import { loadCachedEntitiesForRelease, nameToMBIDCache } from './nameToMBIDCache.js';
import { createReleaseSeederForm } from './seeding.js';
import { createElement, injectStylesheet } from '../utils/dom/create.js';
import { qs } from '../utils/dom/select.js';

/**
 * Injects a MusicBrainz importer form for the given release seed into the given container.
 * Also allows the user to enter entity name to MBID mappings (which are persisted per domain).
 * @param {MB.ReleaseSeed} release 
 * @param {Element} importerContainer
 */
export async function injectImporterUI(release, importerContainer) {
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

	// inject into the given container
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

/**
 * Builds a button to copy the given credits to clipboard.
 * @param {[artist: string, role: string][]} credits 
 */
export function buildCopyCreditsButton(credits) {
	/** @type {HTMLButtonElement} */
	const copyButton = createElement('<button type="button" title="Copy credits to clipboard">Copy credits</button>');
	copyButton.addEventListener('click', () => {
		navigator.clipboard?.writeText(credits.map(([artist, role]) => `${role ?? ''} - ${artist}`).join('\n'));
	});
	copyButton.style.marginTop = '5px';
	return copyButton;
}

const importerStyles = `
form[name="musicbrainz-release-seeder"] button img {
	display: inline;
	vertical-align: middle;
	margin-right: 5px;
}
#mbid-mapping caption {
	font-weight: bold;
}
#mbid-mapping input.error {
	background: #EBB1BA;
}
#mbid-mapping input.success {
	background: #B1EBB0;
}`;

/** Injects the recommended default styling for the importer form. */
export function injectImporterStyle() {
	injectStylesheet(importerStyles, 'musicbrainz-importer');
}
