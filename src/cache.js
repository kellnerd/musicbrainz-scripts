/**
 * @template Params
 * @template Result
 */
export class FunctionCache {
	/**
	 * @param {string} name 
	 * @param {(...params:Params)=>Promise<Result>} expensiveFunction 
	 * @param {(...params:Params)=>string[]} keyMapper 
	 */
	constructor(name, expensiveFunction, keyMapper) {
		this.name = name;
		this.expensiveFunction = expensiveFunction;
		this.keyMapper = keyMapper;
		/** @type {Record<string,Result>} */
		this.data = {};
	}

	/**
	 * @param {Params} params 
	 */
	async get(...params) {
		const keys = this.keyMapper(...params);
		const lastKey = keys.pop();
		if (!lastKey) return;

		let record = this.data;
		let cacheEntry;

		for (const key of keys) {
			cacheEntry = record[key];
			if (cacheEntry === undefined) {
				// create a new entry as empty record for all keys except the last one
				cacheEntry = record[key] = {};
			}
			// prepare to index with the next level of the key
			record = cacheEntry;
		};

		cacheEntry = record[lastKey];
		if (cacheEntry === undefined) {
			// create a new entry to cache the result of the expensive function
			const newEntry = await this.expensiveFunction(...params);
			if (newEntry !== undefined) {
				cacheEntry = record[lastKey] = newEntry;
			}
		}

		return cacheEntry;
	}

	/**
	 * @param {Params} params 
	 * @param {Result} value 
	 */
	set(...params, value) {
		const keys = this.keyMapper(...params);
		let record = this.data;
		keys.forEach((key, index) => {
			if (index === keys.length - 1) {
				record[key] = value;
			} else if (record[key] === undefined) {
				// create a new entry as empty record for all keys except the last one
				record[key] = {};
			}
			// prepare to index with the next level of the key
			record = record[key];
		});
	}

	load() {
		const storedData = window.localStorage.getItem(this.name);
		if (storedData) {
			this.data = JSON.parse(storedData);
		}
	}

	store() {
		window.localStorage.setItem(this.name, JSON.stringify(this.data));
	}

	clear() {
		this.data = {};
		this.store();
	}
}
