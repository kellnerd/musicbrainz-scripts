
/**
 * Extracts the entity type and ID from a MusicBrainz URL (can be incomplete and/or with additional path components and query parameters).
 * @param {string} url URL of a MusicBrainz entity page.
 * @returns {{ type: CoreEntityTypeT | 'mbid', mbid: MB.MBID } | undefined} Type and ID.
 */
export function extractEntityFromURL(url) {
	const entity = url.match(/(area|artist|event|genre|instrument|label|mbid|place|recording|release|release-group|series|url|work)\/([0-9a-f-]{36})(?:$|\/|\?)/);
	return entity ? {
		type: entity[1],
		mbid: entity[2]
	} : undefined;
}

/**
 * @param {CoreEntityTypeT} entityType 
 * @param {MB.MBID | 'add' | 'create'} mbid MBID of an existing entity or `create` for the entity creation page (`add` for releases).
 */
export function buildEntityURL(entityType, mbid) {
	return `https://musicbrainz.org/${entityType}/${mbid}`;
}

/**
 * Constructs a tooltip for the given entity.
 * @param {MB.Entity} entity 
 */
export function getEntityTooltip(entity) {
	let tooltip = `${entity.type}: ${entity['sort-name'] ?? entity.title}`; // fallback for releases
	if (entity.disambiguation) tooltip += ` (${entity.disambiguation})`;
	return tooltip;
}
