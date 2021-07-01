// Adapted from https://thoughtspile.github.io/2018/07/07/rate-limit-promises/

/**
 * Returns a promise that resolves after the given delay.
 * @param {number} ms Delay in milliseconds.
 */
const delay = ms => new Promise((resolve, reject) => setTimeout(resolve, ms));

function rateLimit1(operation, interval) {
	let queue = Promise.resolve(); // empty queue is ready
	return (...args) => {
		const result = queue.then(() => operation(...args)); // queue the next operation
		queue = queue.then(() => delay(interval)); // start the next delay
		return result;
	};
}

/**
 * Limits the number of requests for the given operation within a time interval.
 * @template Params
 * @template Result
 * @param {(...args:Params)=>Result} operation Operation that should be rate-limited.
 * @param {number} interval Time interval (in ms).
 * @param {number} requestsPerInterval Maximum number of requests within the interval.
 * @returns {(...args:Params)=>Promise<Result>} Rate-limited version of the given operation.
 */
export function rateLimit(operation, interval, requestsPerInterval = 1) {
	if (requestsPerInterval == 1) {
		return rateLimit1(operation, interval);
	}
	const queues = Array(requestsPerInterval).fill().map(() => rateLimit1(operation, interval));
	let queueIndex = 0;
	return (...args) => {
		queueIndex = (queueIndex + 1) % requestsPerInterval; // use the next queue
		return queues[queueIndex](...args); // return the rate-limited operation
	};
}
