import { FunctionCache } from './cache.js';
import { fetchEntity } from './internalAPI';

/**
 * Temporary cache for fetched entities from the ws/js API, shared with MBS.
 */
export const entityCache = new FunctionCache(fetchEntity, {
	keyMapper: (gid) => [gid],
	data: MB.entityCache,
});
