import { fetchEntity } from './internalAPI.js';
import { FunctionCache } from '../utils/cache/FunctionCache.js';

/**
 * Temporary cache for fetched entities from the ws/js API, shared with MBS.
 */
export const entityCache = new FunctionCache(fetchEntity, {
	keyMapper: (gid) => [gid],
	data: MB.entityCache,
});
