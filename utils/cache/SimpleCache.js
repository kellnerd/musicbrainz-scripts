import { FunctionCache } from './FunctionCache.js';

/**
 * @template Params
 * @template Result
 * @extends {FunctionCache<Params,Result>}
 */
export class SimpleCache extends FunctionCache {
	/**
	* @param {Object} options
	* @param {string} [options.name] Name of the cache, used as storage key (optional).
	* @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
	* @param {Record<string, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
	*/
	constructor(options) {
		// use a dummy function to make the function cache fail without actually running an expensive function
		super((...params) => undefined, {
			...options,
			keyMapper: (...params) => params,
		});
	}
}
