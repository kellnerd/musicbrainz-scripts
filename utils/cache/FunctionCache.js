/**
 * @template Params
 * @template Result
 */
export class FunctionCache {
	/**
	 * @param {(...params: Params) => Result | Promise<Result>} expensiveFunction Expensive function whose results should be cached.
	 * @param {Object} options
	 * @param {(...params: Params) => string[]} options.keyMapper Maps the function parameters to the components of the cache's key.
	 * @param {string} [options.name] Name of the cache, used as storage key (optional).
	 * @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
	 * @param {Record<string, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
	 */
	constructor(expensiveFunction, options) {
		this.expensiveFunction = expensiveFunction;
		this.keyMapper = options.keyMapper;
		this.name = options.name ?? `defaultCache`;
		this.storage = options.storage;
		this.data = options.data ?? {};
	}

	/**
	 * Looks up the result for the given parameters and returns it.
	 * If the result is not cached, it will be calculated and added to the cache.
	 * @param {Params} params 
	 */
	async get(...params) {
		const keys = this.keyMapper(...params);
		const lastKey = keys.pop();
		if (!lastKey) return;

		const record = this._get(keys);
		if (record[lastKey] === undefined) {
			// create a new entry to cache the result of the expensive function
			const newEntry = await this.expensiveFunction(...params);
			if (newEntry !== undefined) {
				record[lastKey] = newEntry;
			}
		}

		return record[lastKey];
	}

	/**
	 * Manually sets the cache value for the given key.
	 * @param {string[]} keys Components of the key.
	 * @param {Result} value 
	 */
	set(keys, value) {
		const lastKey = keys.pop();
		this._get(keys)[lastKey] = value;
	}

	/**
	 * Loads the persisted cache entries.
	 */
	load() {
		const storedData = this.storage?.getItem(this.name);
		if (storedData) {
			this.data = JSON.parse(storedData);
		}
	}

	/**
	 * Persists all entries of the cache.
	 */
	store() {
		this.storage?.setItem(this.name, JSON.stringify(this.data));
	}

	/**
	 * Clears all entries of the cache and persists the changes.
	 */
	clear() {
		this.data = {};
		this.store();
	}

	/**
	 * Returns the cache record which is indexed by the key.
	 * @param {string[]} keys Components of the key
	 */
	_get(keys) {
		let record = this.data;
		keys.forEach((key) => {
			if (record[key] === undefined) {
				// create an empty record for all missing keys
				record[key] = {};
			}
			record = record[key];
		});
		return record;
	}
}
