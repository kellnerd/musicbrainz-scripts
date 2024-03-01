import { extractEntityFromURL } from './entity.js';
import { rateLimit } from '@kellnerd/es-utils/async/rateLimit.js';

/**
 * Calls to the MusicBrainz API are limited to one request per second.
 * https://musicbrainz.org/doc/MusicBrainz_API
 */
const callAPI = rateLimit(fetch, 1000);

/**
 * Requests the given entity from the MusicBrainz API.
 * @param {string} url (Partial) URL which contains the entity type and the entity's MBID.
 * @param {string[]} inc Include parameters which should be added to the API request.
 * @returns {Promise<MB.Entity>}
 */
export function fetchEntity(url, inc) {
	const entity = extractEntityFromURL(url);
	if (!entity) throw new Error('Invalid entity URL');

	const endpoint = [entity.type, entity.mbid].join('/');
	return fetchFromAPI(endpoint, {}, inc);
}

/**
 * Returns the entity of the desired type which is associated to the given resource URL.
 * @param {CoreEntityTypeT} entityType Desired type of the entity.
 * @param {string} resourceURL 
 * @returns {Promise<MB.Entity>} The first matching entity. (TODO: handle ambiguous URLs)
 */
export async function getEntityForResourceURL(entityType, resourceURL) {
	try {
		const url = await fetchFromAPI('url', { resource: resourceURL }, [`${entityType}-rels`]);
		return url?.relations.filter((rel) => rel['target-type'] === entityType)?.[0][entityType];
	} catch (error) {
		return null;
	}
}

/**
 * Makes a request to the MusicBrainz API of the currently used server and returns the results as JSON.
 * @param {string} endpoint Endpoint (e.g. the entity type) which should be queried.
 * @param {Record<string,string>} query Query parameters.
 * @param {string[]} inc Include parameters which should be added to the query parameters.
 */
export async function fetchFromAPI(endpoint, query = {}, inc = []) {
	if (inc.length) {
		query.inc = inc.join(' '); // spaces will be encoded as `+`
	}
	query.fmt = 'json';
	const headers = {
		'Accept': 'application/json',
		// 'User-Agent': 'Application name/<version> ( contact-url )',
	};
	const response = await callAPI(`https://musicbrainz.org/ws/2/${endpoint}?${new URLSearchParams(query)}`, { headers });
	if (response.ok) {
		return response.json();
	} else {
		throw response;
	}
}
