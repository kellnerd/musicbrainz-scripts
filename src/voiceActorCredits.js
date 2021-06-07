/**
 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
 * @param {Object} artistData Edit data of the performing artist (optional).
 * @param {string} roleName Credited name of the voice actor's role (optional).
 * @returns MusicBrainz "Add relationship" dialog.
 */
export function createVoiceActorDialog(artistData = {}, roleName = '') {
	const viewModel = MB.releaseRelationshipEditor;
	const target = new MB.entity.Artist(artistData);
	const dialog = new MB.relationshipEditor.UI.AddDialog({
		source: viewModel.source,
		target,
		viewModel,
	});
	const rel = dialog.relationship();
	rel.linkTypeID(60); // set type: performance -> performer -> vocals
	rel.setAttributes([{
		type: { gid: 'd3a36e62-a7c4-4eb9-839f-adfebe87ac12' }, // spoken vocals
		credited_as: roleName,
	}]);
	return dialog;
}

function seedVoiceActorDialog(event = null) {
	if (!event) {
		event = document.createEvent('MouseEvent');
	}
	createVoiceActorDialog({ name: 'Jon Doe' }, 'Sherlock Holmes').open(event);
}
