
/**
 * Returns a promise that resolves after the given delay.
 * @param {number} ms Delay in milliseconds.
 */
export function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
