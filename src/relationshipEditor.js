import { extractEntityFromURL } from './entity.js';
import {
	fetchEntity,
} from './internalAPI.js';

/**
 * Creates a dialog to add a relationship to the currently edited source entity.
 * @param {MB.RE.Target<MB.RE.MinimalEntity>} targetEntity Target entity of the relationship.
 * @returns Pre-filled "Add relationship" dialog object.
 */
export function createAddRelationshipDialog(targetEntity) {
	const viewModel = MB.sourceRelationshipEditor
		// releases have multiple relationship editors, edit the release itself
		?? MB.releaseRelationshipEditor;
	return new MB.relationshipEditor.UI.AddDialog({
		viewModel,
		source: viewModel.source,
		target: targetEntity,
	});
}

/**
 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
 * @param {Partial<MB.InternalArtist>} [artistData] Data of the performing artist (optional).
 * @param {string} [roleName] Credited name of the voice actor's role (optional).
 * @param {string} [artistCredit] Credited name of the performing artist (optional).
 * @returns MusicBrainz "Add relationship" dialog.
 */
export function createVoiceActorDialog(artistData = {}, roleName = '', artistCredit = '') {
	const viewModel = MB.releaseRelationshipEditor;
	const target = MB.entity(artistData, 'artist'); // automatically caches entities with a GID (unlike `MB.entity.Artist`)
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

/**
 * Creates an entity object which can be used as target of relationships.
 * @param {string} url URL of a MusicBrainz entity page.
 */
export async function targetEntityFromURL(url) {
	const entity = extractEntityFromURL(url);
	return MB.entity(await fetchEntity(entity.mbid));
}

/**
 * Ensures that the given relationship editor has no active dialog.
 */
export function ensureNoActiveDialog(editor = MB.releaseRelationshipEditor) {
	return new Promise((resolve) => {
		const activeDialog = editor.activeDialog();
		if (activeDialog) {
			// wait until the jQuery UI dialog has been closed
			activeDialog.$dialog.on('dialogclose', () => {
				resolve();
			});
		} else {
			resolve();
		}
	});
}

/**
 * Opens the given dialog, focuses the autocomplete input and triggers the search.
 * @param {*} dialog 
 * @param {Event} [event] Affects the position of the opened dialog (optional).
 */
export function openDialogAndTriggerAutocomplete(dialog, event) {
	dialog.open(event);
	dialog.autocomplete.$input.focus();
	dialog.autocomplete.search();
}
