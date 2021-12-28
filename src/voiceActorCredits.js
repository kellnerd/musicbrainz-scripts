import {
	buildEntityURL as buildDiscogsURL,
	fetchVoiceActors as fetchVoiceActorsFromDiscogs,
} from './discogs.js';
import {
	internalArtist,
} from './internalAPI.js';
import {
	getEntityForResourceURL,
} from './publicAPI.js';
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
		const mbArtist = await getEntityForResourceURL('artist', buildDiscogsURL('artist', actor.id));
		// TODO: use a cache for the Discogs->MB artist mappings

		await ensureNoActiveDialog();

		if (mbArtist) {
			createVoiceActorDialog(internalArtist(mbArtist), roleName, artistCredit).accept();
			// TODO: catch exception which occurs for duplicate rels
		} else {
			console.info('Failed to find the linked MB artist for:', actor);
			// pre-fill dialog with the Discogs artist object (compatible because it also has a `name` property)
			const dialog = createVoiceActorDialog(actor, roleName, artistCredit);
			openDialogAndTriggerAutocomplete(dialog, event);
		}
	}
}
