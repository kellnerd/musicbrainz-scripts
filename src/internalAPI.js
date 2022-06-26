import { createRecordMapper } from '../utils/object/createRecordMapper.js';

/**
 * Fetches the entity with the given MBID from the internal API ws/js.
 * @param {MB.MBID} gid MBID of the entity.
 * @returns {Promise<MB.RE.TargetEntity>}
 */
export async function fetchEntity(gid) {
	const result = await fetch(`/ws/js/entity/${gid}`);
	return MB.entity(await result.json()); // automatically caches entities
}

/**
 * Searches for entities of the given type.
 * @param {MB.EntityType} entityType 
 * @param {string} query 
 * @returns {Promise<MB.InternalEntity[]>}
 */
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
 * @type {(artist: MB.Artist) => Partial<MB.InternalArtist>}
 */
export const internalArtist = createRecordMapper(ARTIST_INTERNAL_FIELDS);
