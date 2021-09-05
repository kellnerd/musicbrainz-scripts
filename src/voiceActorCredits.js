import {
	buildEntityURL as buildDiscogsURL,
	fetchVoiceActors as fetchVoiceActorsFromDiscogs,
} from './discogs.js';
import {
	searchEntity,
	getEntityForResourceURL,
	internalArtist,
} from './api.js';

/**
 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
 * @param {Object} artistData Edit data of the performing artist (optional).
 * @param {string} roleName Credited name of the voice actor's role (optional).
 * @param {string} artistCredit Credited name of the performing artist (optional).
 * @returns MusicBrainz "Add relationship" dialog.
 */
export function createVoiceActorDialog(artistData = {}, roleName = '', artistCredit = '') {
	const viewModel = MB.releaseRelationshipEditor;
	let target = new MB.entity(artistData, 'artist'); // automatically caches entities (unlike `MB.entity.Artist`)
	const dialog = new MB.relationshipEditor.UI.AddDialog({
		source: viewModel.source,
		target,
		viewModel,
	});
	const rel = dialog.relationship();
	rel.linkTypeID(60); // set type: performance -> performer -> vocals
	rel.entity0_credit(artistCredit);
	rel.setAttributes([{
		type: { gid: 'd3a36e62-a7c4-4eb9-839f-adfebe87ac12' }, // spoken vocals
		credited_as: roleName,
	}]);
	return dialog;
}

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
