import { buildEntityURL as buildDiscogsEntityURL } from './discogs.js';
import { getEntityForResourceURL } from './publicAPI.js';
import { FunctionCache } from '../utils/cache/FunctionCache.js';

const DISCOGS_ENTITY_TYPES = {
	artist: 'artist',
	label: 'label',
	release: 'release',
	'release_group': 'master',
};

/**
 * Maps Discogs IDs to MBIDs.
 * @param {MB.EntityType} entityType 
 * @param {number} discogsId 
 */
export async function discogsToMBID(entityType, discogsId) {
	const discogsType = DISCOGS_ENTITY_TYPES[entityType];
	if (!discogsType) return;

	const entity = await getEntityForResourceURL(entityType, buildDiscogsEntityURL(discogsType, discogsId));
	return entity?.id;
}

/**
 * Cache for the mapping of Discogs entities to the MBIDs of their equivalent entities on MusicBrainz.
 */
export const discogsToMBIDCache = new FunctionCache(discogsToMBID, {
	keyMapper: (type, id) => [type, id],
	name: 'discogsToMBIDCache',
	storage: window.localStorage,
});
