import { FunctionCache } from '../utils/cache/FunctionCache.js';

/**
 * Dummy function to make the cache fail without actually running an expensive function.
 * @param {MB.EntityType} entityType
 * @param {string} name
 * @returns {string}
 */
function _nameToMBID(entityType, name) {
	return undefined;
}

export const nameToMBIDCache = new FunctionCache(_nameToMBID, {
	keyMapper: (entityType, name) => [entityType, name],
	name: 'nameToMBIDCache',
	storage: window.localStorage
});
