import { createRecordMapper } from '../utils/object/createRecordMapper.js';

/**
 * Fetches the entity with the given MBID from the internal API ws/js.
 * @param {MB.MBID} gid MBID of the entity.
 */
export async function fetchEntity(gid) {
	const result = await fetch(`/ws/js/entity/${gid}`);
	return MB.entity(await result.json()); // automatically caches entities
}

/**
 * Fetches the core entity with the given MBID from the internal API ws/js.
 * @param {MB.MBID} gid MBID of the entity.
 * @param {string[]} inc Include parameters for ws/js.
 * @returns {Promise<CoreEntityT>}
 */
export async function fetchCoreEntity(gid, inc = []) {
	const query = new URLSearchParams({ inc: inc.join(' ') });
	const result = await fetch(`/ws/js/entity/${gid}?${query}`);
	return result.json();
}

/**
 * Searches for entities of the given type.
 * @param {CoreEntityTypeT} entityType 
 * @param {string} query 
 * @returns {Promise<CoreEntityT[]>}
 */
export async function searchEntity(entityType, query) {
	const result = await fetch(`/ws/js/${entityType}?q=${encodeURIComponent(query)}`);
	return result.json();
}

/**
 * Maps ws/js internal fields for an artist to ws/2 fields (from an API response).
 * @type {KeyMapping<ArtistT, MB.Artist>}
 */
const ARTIST_INTERNAL_FIELDS = {
	gid: 'id', // MBID
	name: 'name',
	sort_name: 'sort-name',
	comment: 'disambiguation',
};

/**
 * Creates a ws/js compatible artist object from an API response.
 * @type {(artist: MB.Artist) => Partial<ArtistT>}
 */
export const internalArtist = createRecordMapper(ARTIST_INTERNAL_FIELDS);
