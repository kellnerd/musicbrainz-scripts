import { rateLimit } from './rateLimit.js';
import 'cross-fetch/dist/node-polyfill.js';

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
	if (response.ok) {
		return response.json();
	} else {
		throw response;
	}
}

/**
 * Fetches the extra artists (credits) for the given release.
 * @param {string} releaseURL URL of a Discogs release page.
 * @returns {Promise<Artist[]>}
 */
export async function fetchCredits(releaseURL) {
	const entity = extractEntityFromURL(releaseURL);
	if (entity && entity[0] === 'release') {
		/** @type {Release} */
		const release = await fetchEntityFromAPI(...entity);
		return release.extraartists.map((artist) => {
			// split roles with credited role names in square brackets (for convenience)
			const roleWithCredit = artist.role.match(/(.+?) \[(.+)\]$/);
			if (roleWithCredit) {
				artist.role = roleWithCredit[1];
				artist.roleCredit = roleWithCredit[2];
			}
			return artist;
		});
	} else {
		throw new Error('Invalid Discogs URL');
	}
}

export async function fetchVoiceActors(releaseURL) {
	return (await fetchCredits(releaseURL)).filter((artist) => ['Voice Actor', 'Narrator'].includes(artist.role));
}


/* Type definitions for IntelliSense (WIP) */

/**
 * @typedef Release
 * @property {string} title
 * @property {number} id
 * @property {Artist[]} artists
 * @property {Artist[]} extraartists Extra artists (credits).
 */

/**
 * @typedef Artist
 * @property {string} name Main artist name.
 * @property {string} anv Artist name variation, empty if no name variation is used.
 * @property {string} join
 * @property {string} role Role of the artist, may contain the role as credited in square brackets.
 * @property {string} [roleCredit] Role name as credited (custom extension for convenience).
 * @property {string} tracks
 * @property {number} id
 * @property {string} resource_url API URL of the artist.
 */
