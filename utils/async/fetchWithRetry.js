
/**
 * Attempts to fetch the given resource.
 * Performs the same request again if the response was not successful before it fails with an error.
 * @param {RequestInfo} input
 * @param {RequestInit} init
 * @param {number} retries Number of retries.
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(input, init, retries = 5) {
	try {
		const response = await fetch(input, init);
		if (response.ok) {
			return response;
		}
		throw new Error(`HTTP status ${response.status} for ${input.url || input}`);
	} catch (error) {
		if (retries <= 0) {
			throw error;
		}
		console.warn('Retrying fetch:', error);
		return await fetchWithRetry(input, init, retries - 1);
	}
}
