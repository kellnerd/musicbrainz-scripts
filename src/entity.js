
export const MBID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

/**
 * Extracts the entity type and ID from a MusicBrainz URL (can be incomplete and/or with additional path components and query parameters).
 * @param {string} url URL of a MusicBrainz entity page.
 * @returns {{ type: MB.EntityType | 'mbid', mbid: MB.MBID } | undefined} Type and ID.
 */
export function extractEntityFromURL(url) {
	const entity = url.match(/(area|artist|event|genre|instrument|label|mbid|place|recording|release|release-group|series|url|work)\/([0-9a-f-]{36})(?:$|\/|\?)/);
	return entity ? {
		type: entity[1],
		mbid: entity[2]
	} : undefined;
}

/**
 * Extracts MBIDs from the given URLs.
 * @param  {string[]} urls
 * @param  {MB.EntityType} entityType Filter URLs by entity type (optional).
 * @param {boolean} unique Removes duplicate MBIDs from the results (optional).
 * @returns {string[]} Array of valid MBIDs.
 */
export function extractMBIDs(urls, entityType = '', unique = false) {
	const pattern = new RegExp(String.raw`${entityType}/(${MBID_REGEX.source})(?:$|\/|\?)`);
	const MBIDs = urls
		.map((url) => url.match(pattern)?.[1]) // returns first capture group or `undefined`
		.filter((mbid) => mbid); // remove undefined MBIDs
	if (unique) {
		return [...new Set(MBIDs)];
	} else {
		return MBIDs;
	}
}

/**
 * @param {MB.EntityType} entityType 
 * @param {MB.MBID | 'add' | 'create'} mbid MBID of an existing entity or `create` for the entity creation page (`add` for releases).
 */
export function buildEntityURL(entityType, mbid) {
	return `https://musicbrainz.org/${entityType}/${mbid}`;
}

/**
 * Builds the URL to the MBS edit page of the given entity.
 * @param {MB.EntityType} entityType Type of the entity.
 * @param {string} mbid MBID of the entity.
 * @returns {string}
 */
export function buildEditUrl(entityType, mbid) {
	return `/${entityType}/${mbid}/edit`;
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
