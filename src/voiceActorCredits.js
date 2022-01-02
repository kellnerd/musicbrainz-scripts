import {
	fetchVoiceActors as fetchVoiceActorsFromDiscogs,
} from './discogs.js';
import {
	entityCache,
} from './entityCache.js';
import {
	discogsToMBIDCache,
} from './entityMapping.js';
import {
	createVoiceActorDialog,
	ensureNoActiveDialog,
	openDialogAndTriggerAutocomplete,
} from './relationshipEditor.js';

export async function importVoiceActorsFromDiscogs(releaseURL) {
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

		await ensureNoActiveDialog();

		if (artistMBID) {
			// mapping already exists, automatically add the relationship
			const mbArtist = await entityCache.get(artistMBID);
			createVoiceActorDialog(mbArtist, roleName, artistCredit).accept();
			// duplicates of already existing rels will be merged automatically
		} else {
			// pre-fill dialog with the Discogs artist object (compatible because it also has a `name` property)
			const dialog = createVoiceActorDialog(actor, roleName, artistCredit);

			// let the user select the matching entity
			openDialogAndTriggerAutocomplete(dialog);
		}
	}

	// persist cache entries after each import, TODO: only do this on page unload
	discogsToMBIDCache.store();
}
