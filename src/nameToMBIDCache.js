import { SimpleCache } from '../utils/cache/SimpleCache.js';

/** @type {SimpleCache<[entityType: MB.EntityType, name: string], MB.MBID>} */
export const nameToMBIDCache = new SimpleCache({
	name: 'nameToMBIDCache',
	storage: window.localStorage,
});
