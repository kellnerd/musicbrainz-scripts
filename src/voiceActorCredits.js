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
	// let target = MB.entity({ entityType: 'artist', ...artistData });
	let target = new MB.entity.Artist(artistData);
	const gid = artistData.gid;
	// TODO: target.gid selects the correct artist but the name has to filled manually and is not highlighted green
	/* if (gid) {
		// probably the display issue is related to the caching of entities, code below does not help
		MB.entityCache[gid] = target = await fetchEntityJS(gid);
		// https://github.com/loujine/musicbrainz-scripts/blob/333a5f7c0a55454080c730b0eb7a22446d48d371/mb-reledit-guess_works.user.js#L54-L56
		target.relationships.forEach((rel) => {
			// apparently necessary to fill MB.entityCache with rels
			MB.getRelationship(rel, target);
		});
	} */
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
	/** @type {[{name:string,anv:string,role:string,id:number,join:string,resource_url:string,tracks:string}]} */
	const actors = await fetchVoiceActorsFromDiscogs(releaseURL);
	for (const actor of actors) {
		console.info(actor);
		const roleName = actor.role.match(/\[(.+)\]/)?.[1] || '';
		const artistCredit = actor.anv || actor.name; // ANV is empty if it is the same as the main name
		const mbArtist = await getEntityForResourceURL('artist', buildDiscogsURL('artist', actor.id));
		if (mbArtist) {
			createVoiceActorDialog(internalArtist(mbArtist), roleName, artistCredit).accept();
		} else {
			console.warn(`Failed to add credit '${roleName}' for '${actor.name} => Guessing...'`);
			const mbArtistGuess = (await searchEntity('artist', actor.name))[0]; // first result
			createVoiceActorDialog(mbArtistGuess, roleName, artistCredit).accept();
			// .open(event);
			// TODO: wait for the dialog to be closed
		}
	}
}
