import { createRecordMapper } from './createRecordMapper.js';

/**
 * Fetches the entity with the given MBID from the internal API ws/js.
 * @param {string} gid MBID of the entity.
 */
export async function fetchEntity(gid) {
	const result = await fetch(`/ws/js/entity/${gid}`);
	return result.json();
}

export async function searchEntity(entityType, query) {
	const result = await fetch(`/ws/js/${entityType}?q=${encodeURIComponent(query)}`);
	return result.json();
}

/**
 * Extracts the entity type and ID from a MusicBrainz URL.
 * @param {string} url URL of a MusicBrainz entity page.
 * @returns {{type:string,mbid:string}|undefined} Type and ID.
 */
export function extractEntityFromURL(url) {
	const entity = url.match(/(area|artist|event|genre|instrument|label|place|release|release-group|series|url|work)\/([0-9a-f-]{36})$/);
	return entity ? {
		type: entity[1],
		mbid: entity[2],
	} : undefined;
}

/**
 * Maps ws/js internal fields for an artist to ws/2 fields (from an API response).
 */
const ARTIST_INTERNAL_FIELDS = {
	gid: 'id', // MBID
	name: 'name',
	sort_name: 'sort-name',
	comment: 'disambiguation',
};

/**
 * Creates a ws/js compatible artist object from an API response.
 */
export const internalArtist = createRecordMapper(ARTIST_INTERNAL_FIELDS);
