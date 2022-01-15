import { useUnicodePunctuation } from './guessUnicodePunctuation.js';
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
 * @returns {[Discogs.EntityType,string]|undefined} Type and ID.
 */
function extractEntityFromURL(url) {
	return url.match(/(artist|label|master|release)\/(\d+)/)?.slice(1);
}

/**
 * @param {Discogs.EntityType} entityType 
 * @param {number} entityId 
 */
export function buildEntityURL(entityType, entityId) {
	return `https://www.discogs.com/${entityType}/${entityId}`;
}

/**
 * Requests the given entity from the Discogs API.
 * @param {Discogs.EntityType} entityType 
 * @param {number} entityId 
 */
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
 */
export async function fetchCredits(releaseURL) {
	const entity = extractEntityFromURL(releaseURL);
	if (entity && entity[0] === 'release') {
		/** @type {Discogs.Release} */
		const release = await fetchEntityFromAPI(...entity);
		return release.extraartists.map((artist) => {
			/** @type {Discogs.ParsedArtist} */
			const parsedArtist = { ...artist };
			// drop bracketed numeric suffixes for ambiguous artist names
			parsedArtist.name = artist.name.replace(/ \(\d+\)$/, '');

			parsedArtist.anv = useUnicodePunctuation(artist.anv || parsedArtist.name);

			// split roles with credited role names in square brackets (for convenience)
			const roleWithCredit = artist.role.match(/(.+?) \[(.+)\]$/);
			if (roleWithCredit) {
				parsedArtist.role = roleWithCredit[1];
				parsedArtist.roleCredit = useUnicodePunctuation(roleWithCredit[2]);
			}

			return parsedArtist;
		});
	} else {
		throw new Error('Invalid Discogs URL');
	}
}

/**
 * Fetches the voice actor and narrator credits for the given release.
 * @param {string} releaseURL URL of a Discogs release page.
 */
export async function fetchVoiceActors(releaseURL) {
	return (await fetchCredits(releaseURL))
		.filter((artist) => ['Voice Actor', 'Narrator'].includes(artist.role))
		.flatMap((artist) => {
			// split artists with multiple roles into multiple credits
			const roles = artist.roleCredit.split('/');
			if (roles.length === 1) return artist;
			return roles.map((role) => ({ ...artist, roleCredit: role.trim() }));
		});
}
