import { SimpleCache } from '../utils/cache/SimpleCache.js';

/** @type {SimpleCache<[entityType: MB.EntityType, name: string], MB.MBID>} */
export const nameToMBIDCache = new SimpleCache({
	name: 'nameToMBIDCache',
	storage: window.localStorage,
});

/**
 * Loads the MBIDs of cached entity names for the given release seed.
 * @param {MB.ReleaseSeed} release 
 * @returns Names and types of entities which have not been found in the cache.
 */
export async function loadCachedEntitiesForRelease(release) {
	return Promise.all([
		...loadCachedArtists(release.artist_credit) ?? [],
		...loadCachedLabels(release) ?? [],
		...release.mediums?.flatMap(
			(medium) => medium.track?.flatMap(
				(track) => loadCachedArtists(track.artist_credit) ?? []
			) ?? []
		) ?? [],
	]);
}

/** @param {MB.ArtistCreditSeed} artistCredit */
function loadCachedArtists(artistCredit) {
	return artistCredit?.names.map((credit) => loadCachedMBID(credit, 'artist', credit.artist?.name ?? credit.name));
}

/** @param {MB.ReleaseSeed} release */
function loadCachedLabels(release) {
	return release.labels?.map((label) => loadCachedMBID(label, 'label', label.name));
}

/**
 * @param {{ mbid: MB.MBID }} entity 
 * @param {MB.EntityType} entityType 
 * @param {string} name 
 * @returns Type and name of the entity if it was not found in the cache.
 */
async function loadCachedMBID(entity, entityType, name) {
	if (entity.mbid || !name) return; // nothing to do

	const mbid = await nameToMBIDCache.get(entityType, name);
	if (mbid) {
		entity.mbid = mbid;
	} else {
		return {
			entityType,
			name,
		};
	}
}
