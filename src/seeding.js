import { buildEditNote } from './editNote.js';

/**
 * Creates an URL to seed the editor of the given artist with the given external link.
 * @param {MB.MBID} mbid MBID of the artist.
 * @param {string} url External link.
 * @param {number} linkTypeID
 * @param {string} [editNote]
 */

export function seedURLForArtist(mbid, url, linkTypeID, editNote) {
	const seedingParams = new URLSearchParams({
		'edit-artist.url.0.text': url,
		'edit-artist.url.0.link_type_id': linkTypeID
	});

	if (editNote) {
		seedingParams.set('edit-artist.edit_note', buildEditNote(editNote));
	}

	return `https://musicbrainz.org/artist/${mbid}/edit?${seedingParams}`;
}
