import { buildEditNote } from './editNote.js';
import { buildEntityURL } from './entity.js';

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
