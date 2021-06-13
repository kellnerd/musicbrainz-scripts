/**
 * Returns the entity of the desired type which is associated to the given ressource URL.
 * @param {string} entityType Desired type of the entity.
 * @param {*} resourceURL 
 * @returns {Promise<{name:string,id:string}>} The first matching entity. (TODO: handle ambiguous URLs)
 */
export async function getEntityForResourceURL(entityType, resourceURL) {
	const url = await fetchFromAPI('url', new URLSearchParams({ resource: resourceURL }), [`${entityType}-rels`]);
	return url?.relations.filter((rel) => rel['target-type'] === entityType)?.[0][entityType];
}

/**
 * Makes a request to the MusicBrainz API of the currently used server and returns the results as JSON.
 * @param {string} endpoint Endpoint (e.g. the entity type) which should be queried.
 * @param {URLSearchParams} query Query parameters.
 * @param {string[]} inc Include parameters which will should be added to the query parameters.
 */
export async function fetchFromAPI(endpoint, query = new URLSearchParams(), inc = []) {
	if (inc.length) {
		query.append('inc', inc.join(' ')); // spaces will be encoded as `+`
	}
	query.append('fmt', 'json');
	const result = await fetch(`/ws/2/${endpoint}?${query}`);
	return result.json();
}

/**
 * Fetches the entity with the given MBID from the internal API ws/js.
 * @param {string} gid MBID of the entity.
 */
export async function fetchEntityJS(gid) {
	const result = await fetch(`/ws/js/entity/${gid}?inc=rels`);
	return result.json();
}

export const delay = (millis) => new Promise((resolve, reject) => {
	setTimeout(resolve, millis);
});
