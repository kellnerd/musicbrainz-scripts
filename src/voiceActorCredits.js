import { entityCache } from './entityCache.js';
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
			// pre-fill dialog with the Discogs artist object (compatible because it also has a `name` property)
			const dialog = createVoiceActorDialog(actor, roleName, artistCredit);

			// let the user select the matching entity
			openDialogAndTriggerAutocomplete(dialog);
			await closingDialog(dialog);

			// collect mappings for freshly matched artists
			const artistMatch = getTargetEntity(dialog);
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
