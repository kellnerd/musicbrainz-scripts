
/**
 * Performs an XMLHttpRequest which can cross the same origin policy boundaries.
 * @param {URL | string} url 
 * @param {GM.Request} options 
 * @returns {Promise<GM.Response>}
 */
export function xhr(url, options) {
	return new Promise((resolve, reject) => {
		GM.xmlHttpRequest({
			method: 'GET',
			url: url instanceof URL ? url.href : url,
			onload: resolve,
			onerror: reject,
			onabort: reject,
			ontimeout: reject,
			...options,
		});
	});
}

/**
 * @param {URL | string} url 
 * @param {GM.Request} options 
 */
export async function fetch(url, options) {
	const response = await xhr(url, options);

	if (response.status >= 400) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	return response.responseText;
}

/**
 * @param {URL | string} url 
 * @param {GM.Request} options 
 */
export async function fetchJSON(url, options) {
	const response = await fetch(url, {
		responseType: 'json',
		...options,
	});
	return JSON.parse(response);
}
