import { buildApiURL, extractEntityFromURL } from './entity.js';
import { rateLimit } from '@kellnerd/es-utils/async/rateLimit.js';
import { guessUnicodePunctuation } from '@kellnerd/es-utils/string/punctuation.js';

/**
 * Calls to the Discogs API are limited to 25 unauthenticated requests per minute.
 * https://www.discogs.com/developers/
 */
const callAPI = rateLimit(fetch, 60 * 1000, 25);

/**
 * Requests the given entity from the Discogs API.
 * @param {Discogs.EntityType} entityType 
 * @param {number} entityId 
 */
async function fetchEntityFromAPI(entityType, entityId) {
	const response = await callAPI(buildApiURL(entityType, entityId));
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
		return release.extraartists.flatMap((artist) => {
			// drop bracketed numeric suffixes for ambiguous artist names
			artist.name = artist.name.replace(/ \(\d+\)$/, '');

			artist.anv = guessUnicodePunctuation(artist.anv || artist.name);

			// split multiple roles into multiple credits (separated by commas which are not inside square brackets)
			return artist.role.split(/,\s*(?![^[\]]*\])/).map((role) => {
				/** @type {Discogs.ParsedArtist} */
				const parsedArtist = { ...artist };

				// use a separate attribute for credited role names in square brackets
				const roleWithCredit = role.match(/(.+?) \[(.+)\]$/);
				if (roleWithCredit) {
					parsedArtist.role = roleWithCredit[1];
					parsedArtist.roleCredit = guessUnicodePunctuation(roleWithCredit[2]);
				} else {
					parsedArtist.role = role;
				}

				return parsedArtist;
			});
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
			const roles = artist.roleCredit?.split('/');
			if (!roles || roles.length === 1) return artist;
			return roles.map((role) => ({ ...artist, roleCredit: role.trim() }));
		});
}
