import {
	buildEntityURL as buildDiscogsURL,
	fetchVoiceActors as fetchVoiceActorsFromDiscogs,
} from './discogs.js';
import {
	internalArtist,
	searchEntity,
} from './internalAPI.js';
import {
	getEntityForResourceURL,
} from './publicAPI.js';
import {
	createVoiceActorDialog,
} from './relationshipEditor.js';

export async function importVoiceActorsFromDiscogs(releaseURL, event = document.createEvent('MouseEvent')) {
	const actors = await fetchVoiceActorsFromDiscogs(releaseURL);
	for (const actor of actors) {
		console.info(actor);
		const roleName = actor.roleCredit;
		const artistCredit = actor.anv || actor.name; // ANV is empty if it is the same as the main name
		const mbArtist = await getEntityForResourceURL('artist', buildDiscogsURL('artist', actor.id));
		// TODO: use a cache for the Discogs->MB artist mappings
		if (mbArtist) {
			createVoiceActorDialog(internalArtist(mbArtist), roleName, artistCredit).accept();
			// TODO: catch exception which occurs for duplicate rels
		} else {
			console.warn(`Failed to add credit '${roleName}' for '${actor.name}' => Guessing...`);
			const mbArtistGuess = (await searchEntity('artist', actor.name))[0]; // first result
			// TODO: check if artist name is identical/similar or just an unrelated result
			createVoiceActorDialog(mbArtistGuess, roleName, artistCredit).accept();
			// .open(event);
			// TODO: wait for the dialog to be closed
		}
	}
}
