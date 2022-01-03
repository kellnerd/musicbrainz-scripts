/**
 * Extracts the entity type and ID from a MusicBrainz URL (can be incomplete and/or with additional path components and query parameters).
 * @param {string} url URL of a MusicBrainz entity page.
 * @returns {{ type: MB.EntityType, mbid: MB.MBID } | undefined} Type and ID.
 */
export function extractEntityFromURL(url) {
	const entity = url.match(/(area|artist|event|genre|instrument|label|place|release|release-group|series|url|work)\/([0-9a-f-]{36})(?:$|\/|\?)/);
	return entity ? {
		type: entity[1],
		mbid: entity[2]
	} : undefined;
}

/**
 * @param {MB.EntityType} entityType 
 * @param {MB.MBID} mbid 
 */
export function buildEntityURL(entityType, mbid) {
	return `https://musicbrainz.org/${entityType}/${mbid}`;
}
