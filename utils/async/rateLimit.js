// Adapted from https://thoughtspile.github.io/2018/07/07/rate-limit-promises/

import { delay } from './delay.js';

function rateLimitedQueue(operation, interval) {
	let queue = Promise.resolve(); // empty queue is ready
	return (...args) => {
		const result = queue.then(() => operation(...args)); // queue the next operation
		// start the next delay, regardless of the last operation's success
		queue = queue.then(() => delay(interval), () => delay(interval));
		return result;
	};
}

function queue(operation) {
	let queue = Promise.resolve(); // empty queue is ready
	return (...args) => {
		// queue the next operation, regardless of the last operation's success
		queue = queue.then(() => operation(...args), () => operation(...args));
		return queue; // now points to the result of the just enqueued operation
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
		return rateLimitedQueue(operation, interval);
	}
	const queues = Array(requestsPerInterval).fill().map(() => rateLimitedQueue(operation, interval));
	let queueIndex = 0;
	return (...args) => {
		queueIndex = (queueIndex + 1) % requestsPerInterval; // use the next queue
		return queues[queueIndex](...args); // return the result of the operation
	};
}

/**
 * Limits the number of simultaneous requests for the given operation.
 * @template Params
 * @template Result
 * @param {(...args:Params)=>Result} operation Operation that should be limited in its use.
 * @param {number} concurrency Maximum number of concurrent requests at any time.
 * @returns {(...args:Params)=>Promise<Result>} Concurrency-limited version of the given operation.
 */
export function limit(operation, concurrency = 1) {
	if (concurrency == 1) {
		return queue(operation);
	}
	const queues = Array(concurrency).fill().map(() => queue(operation));
	let queueIndex = 0;
	return (...args) => {
		queueIndex = (queueIndex + 1) % concurrency; // use the next queue
		return queues[queueIndex](...args); // return the result of the operation
	};
}
