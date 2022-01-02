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

export async function importVoiceActorsFromDiscogs(releaseURL, event) {
	const actors = await fetchVoiceActorsFromDiscogs(releaseURL);
	for (const actor of actors) {
		console.debug(actor);
		let roleName = actor.roleCredit;

		// always give Discogs narrators a role name,
		// otherwise both "Narrator" and "Voice Actors" roles are mapped to MB's "spoken vocals" rels without distinction
		if (!roleName && actor.role === 'Narrator') {
			roleName = 'Narrator'; // TODO: localize according to release language?
		}

		const artistCredit = actor.anv || actor.name; // ANV is empty if it is the same as the main name
		const artistMBID = await discogsToMBIDCache.get('artist', actor.id);

		await ensureNoActiveDialog();

		if (artistMBID) {
			const mbArtist = await entityCache.get(artistMBID);
			createVoiceActorDialog(mbArtist, roleName, artistCredit).accept();
			// TODO: skip already existing rels, use the entity cache of MBS?
		} else {
			console.info('Failed to find the linked MB artist for:', actor);
			// pre-fill dialog with the Discogs artist object (compatible because it also has a `name` property)
			const dialog = createVoiceActorDialog(actor, roleName, artistCredit);
			openDialogAndTriggerAutocomplete(dialog, event);
		}
	}

	// persist cache entries after each import, TODO: only do this on page unload
	discogsToMBIDCache.store();
	entityCache.store();
}
