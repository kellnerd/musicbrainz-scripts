import { entityCache } from './entityCache.js';
import { nameToMBIDCache } from './nameToMBIDCache.js';
import {
	closingDialog,
	createVoiceActorDialog,
	getTargetEntity,
	openDialogAndTriggerAutocomplete,
} from './relationshipEditor.js';
import { fetchVoiceActors as fetchVoiceActorsFromDiscogs } from './discogs/api.js';
import { buildEntityURL as buildDiscogsURL } from './discogs/entity.js';
import { discogsToMBIDCache } from './discogs/entityMapping.js';

/**
 * Adds a voice actor release relationship for the given artist and their role.
 * Automatically maps artist names to MBIDs where possible, asks the user to match the remaining ones.
 * @param {string} artistName Artist name (as credited).
 * @param {string} roleName Credited role of the artist.
 * @param {boolean} [bypassCache] Bypass the name to MBID cache to overwrite wrong entries, disabled by default.
 * @returns {Promise<CreditParserLineStatus>}
 */
export async function addVoiceActorRelationship(artistName, roleName, bypassCache = false) {
	const artistMBID = !bypassCache && await nameToMBIDCache.get('artist', artistName);

	if (artistMBID) {
		// mapping already exists, automatically add the relationship
		const mbArtist = await entityCache.get(artistMBID);
		createVoiceActorDialog(mbArtist, roleName, artistName).accept();
		return 'done';
	} else {
		// pre-fill dialog and collect mappings for freshly matched artists
		const artistMatch = await letUserSelectVoiceActor(artistName, roleName, artistName);
		if (artistMatch.gid) {
			nameToMBIDCache.set(['artist', artistName], artistMatch.gid);
			return 'done';
		} else {
			return 'skipped';
		}
	}
}

/**
 * Imports all existing voice actor credits from the given Discogs release.
 * Automatically maps Discogs entities to MBIDs where possible, asks the user to match the remaining ones.
 * @param {string} releaseURL URL of the Discogs source release.
 * @returns - Number of credits (total & automatically mapped).
 * - List of unmapped entities (manually matched or skipped) for which MB does not store the Discogs URLs.
 */
export async function importVoiceActorsFromDiscogs(releaseURL) {
	/**
	 * Unmapped entities for which MB does not store the Discogs URLs.
	 * @type {EntityMapping[]}
	 */
	const unmappedArtists = [];
	let mappedCredits = 0;

	const actors = await fetchVoiceActorsFromDiscogs(releaseURL);
	for (const actor of actors) {
		console.debug(actor);
		let roleName = actor.roleCredit;

		// always give Discogs narrators a role name,
		// otherwise both "Narrator" and "Voice Actors" roles are mapped to MB's "spoken vocals" rels without distinction
		if (!roleName && actor.role === 'Narrator') {
			roleName = 'Narrator'; // TODO: localize according to release language?
		}

		const artistCredit = actor.anv; // we are already using the name as a fallback
		const artistMBID = await discogsToMBIDCache.get('artist', actor.id);

		if (artistMBID) {
			// mapping already exists, automatically add the relationship
			const mbArtist = await entityCache.get(artistMBID);
			createVoiceActorDialog(mbArtist, roleName, artistCredit).accept();
			mappedCredits++;
			// duplicates of already existing rels will be merged automatically
		} else {
			// pre-fill dialog and collect mappings for freshly matched artists
			const artistMatch = await letUserSelectVoiceActor(actor.name, roleName, artistCredit);
			if (artistMatch.gid) {
				discogsToMBIDCache.set(['artist', actor.id], artistMatch.gid);
			}
			unmappedArtists.push({
				MBID: artistMatch.gid,
				name: artistMatch.name,
				comment: artistMatch.comment,
				externalURL: buildDiscogsURL('artist', actor.id),
				externalName: actor.name,
			});
		}
	}

	// persist cache entries after each import, TODO: only do this on page unload
	discogsToMBIDCache.store();

	return {
		totalCredits: actors.length,
		mappedCredits,
		unmappedArtists,
	};
}

async function letUserSelectVoiceActor(artistName, roleName, artistCredit) {
	const dialog = createVoiceActorDialog({ name: artistName }, roleName, artistCredit);

	// let the user select the matching entity
	openDialogAndTriggerAutocomplete(dialog);
	await closingDialog(dialog);

	return getTargetEntity(dialog);
}
