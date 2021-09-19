import { rateLimit } from './rateLimit.js';

/**
 * Calls to the MusicBrainz API are limited to one request per second.
 * https://musicbrainz.org/doc/MusicBrainz_API
 */
const callAPI = rateLimit(fetch, 1000);

/**
 * Extracts the entity type and ID from a MusicBrainz URL.
 * @param {string} url URL of a MusicBrainz entity page.
 * @returns {{type:string,mbid:string}|undefined} Type and ID.
 */
export function extractEntityFromURL(url) {
	const entity = url.match(/(area|artist|event|genre|instrument|label|place|release|release-group|series|url|work)\/([0-9a-f-]{36})$/);
	return entity ? {
		type: entity[1],
		mbid: entity[2],
	} : undefined;
}

/**
 * Returns the entity of the desired type which is associated to the given ressource URL.
 * @param {string} entityType Desired type of the entity.
 * @param {string} resourceURL 
 * @returns {Promise<{name:string,id:string}>} The first matching entity. (TODO: handle ambiguous URLs)
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
	const response = await callAPI(`/ws/2/${endpoint}?${new URLSearchParams(query)}`, { headers });
	if (response.ok) {
		return response.json();
	} else {
		throw response;
	}
}

/**
 * Fetches the entity with the given MBID from the internal API ws/js.
 * @param {string} gid MBID of the entity.
 */
export async function fetchEntityJS(gid) {
	const result = await fetch(`/ws/js/entity/${gid}`);
	return result.json();
}

export async function searchEntity(entityType, query) {
	const result = await fetch(`/ws/js/${entityType}?q=${encodeURIComponent(query)}`);
	return result.json();
}

/**
 * Creates a function that maps entries of an input record to different property names of the output record according
 * to the given mapping. Only properties with an existing mapping will be copied.
 * @param {Record<string,string>} mapping Maps property names of the output record to those of the input record.
 * @returns {(input:Record<string,any>)=>Record<string,any>} Mapper function.
 */
function createRecordMapper(mapping) {
	return function (input) {
		/** @type {Record<string,any>} */
		let output = {};
		for (let outputProperty in mapping) {
			const inputProperty = mapping[outputProperty];
			const value = input[inputProperty];
			if (value !== undefined) {
				output[outputProperty] = value;
			}
		}
		return output;
	};
}

/**
 * Maps ws/js internal fields for an artist to ws/2 fields (from an API response).
 */
const ARTIST_INTERNAL_FIELDS = {
	gid: 'id', // MBID
	name: 'name',
	sort_name: 'sort-name',
	comment: 'disambiguation',
};

/**
 * Creates a ws/js compatible artist object from an API response.
 */
export const internalArtist = createRecordMapper(ARTIST_INTERNAL_FIELDS);
