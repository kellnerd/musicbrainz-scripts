import { delay } from './delay.js';

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
