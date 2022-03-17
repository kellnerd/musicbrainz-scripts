import { buildEditNote } from './editNote.js';
import { buildEntityURL } from './entity.js';
import { createHiddenForm } from '../utils/dom/form.js';
import { flatten } from '../utils/object/flatten.js';

/**
 * Creates a form with hidden inputs and a submit button to seed a new release on MusicBrainz.
 * @param {MB.ReleaseSeed} releaseData Data of the release.
 */
export function createReleaseSeederForm(releaseData) {
	const form = createHiddenForm(flatten(releaseData, ['type']));
	form.action = buildEntityURL('release', 'add')
	form.method = 'POST';
	form.target = '_blank';
	form.name = 'musicbrainz-release-seeder';

	const importButton = document.createElement('button');
	const icon = document.createElement('img');
	icon.src = '//musicbrainz.org/favicon.ico';
	importButton.append(icon, 'Import into MusicBrainz');
	importButton.title = 'Import this release into MusicBrainz (open a new tab)'
	form.appendChild(importButton);

	return form;
}

/**
 * Creates an URL to seed the editor of the given entity with the given external link.
 * @param {MB.EntityType} type Type of the target entity.
 * @param {MB.MBID} mbid MBID of the target entity.
 * @param {string} url External link.
 * @param {number} linkTypeID
 * @param {string} [editNote]
 */
export function seedURLForEntity(type, mbid, url, linkTypeID, editNote) {
	const seedingParams = new URLSearchParams({
		[`edit-${type}.url.0.text`]: url,
		[`edit-${type}.url.0.link_type_id`]: linkTypeID,
	});

	if (editNote) {
		seedingParams.set(`edit-${type}.edit_note`, buildEditNote(editNote));
	}

	return `${buildEntityURL(type, mbid)}/edit?${seedingParams}`;
}
