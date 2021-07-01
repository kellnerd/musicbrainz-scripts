import { rateLimit } from './rateLimit';

/**
 * Calls to the Discogs API are limited to 25 unauthenticated requests per minute.
 * https://www.discogs.com/developers/
 */
const callAPI = rateLimit(fetch, 60 * 1000, 25);

/**
 * Extracts the entity type and ID from a Discogs URL.
 * @param {string} url URL of a Discogs entity page.
 * @returns {[string,string]|undefined} Type and ID.
 */
function extractEntityFromURL(url) {
	return url.match(/(artist|label|master|release)\/(\d+)$/)?.slice(1);
}

export function buildEntityURL(entityType, entityId) {
	return `https://www.discogs.com/${entityType}/${entityId}`;
}

async function fetchEntityFromAPI(entityType, entityId) {
	const url = `https://api.discogs.com/${entityType}s/${entityId}`;
	const response = await callAPI(url);
	return response.json();
}

export async function fetchVoiceActors(releaseURL) {
	const entity = extractEntityFromURL(releaseURL);
	if (entity && entity[0] === 'release') {
		const release = await fetchEntityFromAPI(...entity);
		return release.extraartists.filter((artist) => artist.role.startsWith('Voice Actor'));
	}
}
