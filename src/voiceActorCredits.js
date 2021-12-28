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
	ensureNoActiveDialog,
} from './relationshipEditor.js';

export async function importVoiceActorsFromDiscogs(releaseURL, event = document.createEvent('MouseEvent')) {
	const actors = await fetchVoiceActorsFromDiscogs(releaseURL);
	for (const actor of actors) {
		console.debug(actor);
		const roleName = actor.roleCredit;
		const artistCredit = actor.anv || actor.name; // ANV is empty if it is the same as the main name
		const mbArtist = await getEntityForResourceURL('artist', buildDiscogsURL('artist', actor.id));
		// TODO: use a cache for the Discogs->MB artist mappings

		await ensureNoActiveDialog();

		if (mbArtist) {
			createVoiceActorDialog(internalArtist(mbArtist), roleName, artistCredit).accept();
			// TODO: catch exception which occurs for duplicate rels
		} else {
			console.info('Failed to find the linked MB artist for:', actor);
			const mbArtistGuess = (await searchEntity('artist', actor.name))[0]; // first result

			// check if artist name is identical or just an unrelated result
			// TODO: retry failed search requests instead of skipping an undefined mbArtistGuess
			if (mbArtistGuess && mbArtistGuess.name === actor.name) {
				createVoiceActorDialog(mbArtistGuess, roleName, artistCredit).accept();
			} else {
				// pre-fill dialog with the Discogs artist object (compatible because it also has a `name` property)
				createVoiceActorDialog(actor, roleName, artistCredit).open(event);
			}
		}
	}
}
