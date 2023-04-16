import { SimpleCache } from '@kellnerd/es-utils/cache/SimpleCache.js';

/** @type {SimpleCache<[entityType: CoreEntityTypeT, name: string], MB.MBID>} */
export const nameToMBIDCache = new SimpleCache({
	name: 'nameToMBIDCache',
	storage: window.localStorage,
});

/**
 * Loads the MBIDs of cached entity names for the given release seed.
 * @param {MB.ReleaseSeed} release 
 * @returns Name, type and MBID (if already given or found in the cache) of the related entities.
 */
export async function loadCachedEntitiesForRelease(release) {
	return Promise.all([
		...loadCachedArtists(release.artist_credit),
		...loadCachedLabels(release),
		...release.mediums?.flatMap(
			(medium) => medium.track?.flatMap(
				(track) => loadCachedArtists(track.artist_credit)
			) ?? []
		) ?? [],
	]).then((entities) => entities.filter((entity) => entity));
}

/** @param {MB.ArtistCreditSeed} artistCredit */
function loadCachedArtists(artistCredit) {
	return artistCredit?.names.map((credit) => loadCachedMBID(credit, 'artist', credit.artist?.name ?? credit.name)) ?? [];
}

/** @param {MB.ReleaseSeed} release */
function loadCachedLabels(release) {
	return release.labels?.map((label) => loadCachedMBID(label, 'label', label.name)) ?? [];
}

/**
 * @param {{ mbid: MB.MBID }} entity 
 * @param {CoreEntityTypeT} type 
 * @param {string} name 
 * @returns Type and name of the entity if it was not found in the cache.
 */
async function loadCachedMBID(entity, type, name) {
	let mbid = entity.mbid;

	if (!mbid) {
		mbid = await nameToMBIDCache.get(type, name);
		if (mbid) {
			entity.mbid = mbid;
		}
	}

	return { type, name, mbid };
}
