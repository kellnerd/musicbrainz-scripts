import { createRecordMapper } from './createRecordMapper.js';

/**
 * Fetches the entity with the given MBID from the internal API ws/js.
 * @param {string} gid MBID of the entity.
 */
export async function fetchEntity(gid) {
	const result = await fetch(`/ws/js/entity/${gid}`);
	return MB.entity(await result.json()); // automatically caches entities
}

export async function searchEntity(entityType, query) {
	const result = await fetch(`/ws/js/${entityType}?q=${encodeURIComponent(query)}`);
	return result.json();
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
