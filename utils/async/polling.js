import { delay } from './delay.js';

/**
 * Retries the given operation until the result is no longer undefined.
 * @template T
 * @param {() => MaybePromise<T>} operation 
 * @param {Object} [options]
 * @param {number} [options.retries] Maximum number of retries.
 * @param {number} [options.wait] Number of ms to wait before the next try, disabled by default.
 * @returns The final result of the operation.
 */
export async function retry(operation, { retries = 10, wait = 0 } = {}) {
	do {
		const result = await operation();
		if (result !== undefined) return result;
		if (wait) await delay(wait);
		console.debug('Retrying', operation);
	} while (retries--)
}

/**
 * Periodically calls the given function until it returns `true` and resolves afterwards.
 * @param {(...params) => boolean} pollingFunction
 * @param {number} pollingInterval
 */
export function waitFor(pollingFunction, pollingInterval) {
	return new Promise(async (resolve) => {
		while (pollingFunction() === false) {
			await delay(pollingInterval);
		}
		resolve();
	});
}
