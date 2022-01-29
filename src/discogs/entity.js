
/**
 * Extracts the entity type and ID from a Discogs URL.
 * @param {string} url URL of a Discogs entity page.
 * @returns {[Discogs.EntityType,string]|undefined} Type and ID.
 */
export function extractEntityFromURL(url) {
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
 * @param {Discogs.EntityType} entityType
 * @param {number} entityId
 */
export function buildApiURL(entityType, entityId) {
	return `https://api.discogs.com/${entityType}s/${entityId}`;
}
