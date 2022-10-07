import { hasReactRelEditor } from './relationship-editor/common.js';
import { extractEntityFromURL } from './entity.js';
import {
	fetchEntity,
} from './internalAPI.js';
import { waitFor } from '../utils/async/polling.js';

/**
 * Creates a dialog to add a relationship to the currently edited source entity.
 * @param {MB.RE.Target<MB.RE.MinimalEntity>} targetEntity Target entity of the relationship.
 * @param {boolean} [backward] Swap source and target entity of the relationship (if they have the same type).
 * @returns {MB.RE.Dialog} Pre-filled relationship dialog.
 */
export function createAddRelationshipDialog(targetEntity, backward = false) {
	const viewModel = MB.sourceRelationshipEditor
		// releases have multiple relationship editors, edit the release itself
		?? MB.releaseRelationshipEditor;
	return new MB.relationshipEditor.UI.AddDialog({
		viewModel,
		source: viewModel.source,
		target: targetEntity,
		backward,
	});
}

/**
 * Creates a dialog to batch-add relationships to the given source entities of the currently edited release.
 * @param {MB.RE.Target<MB.RE.MinimalEntity>} targetEntity Target entity of the relationship.
 * @param {MB.RE.TargetEntity[]} sourceEntities Entities to which the relationships should be added.
 * @returns {MB.RE.Dialog} Pre-filled relationship dialog.
 */
export function createBatchAddRelationshipsDialog(targetEntity, sourceEntities) {
	const viewModel = MB.releaseRelationshipEditor;
	return new MB.relationshipEditor.UI.BatchRelationshipDialog({
		viewModel,
		sources: sourceEntities,
		target: targetEntity,
	});
}

/**
 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
 * @param {Partial<MB.InternalArtist>} [artistData] Data of the performing artist (optional).
 * @param {string} [roleName] Credited name of the voice actor's role (optional).
 * @param {string} [artistCredit] Credited name of the performing artist (optional).
 */
export function createVoiceActorDialog(artistData = {}, roleName = '', artistCredit = '') {
	const viewModel = MB.releaseRelationshipEditor;
	const target = MB.entity(artistData, 'artist'); // automatically caches entities with a GID (unlike `MB.entity.Artist`)
	/** @type {MB.RE.Dialog} */
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
export function targetEntityFromURL(url) {
	const entity = extractEntityFromURL(url);
	return fetchEntity(entity.mbid);
}

/**
 * Resolves after the given dialog has been closed.
 * @param {MB.RE.Dialog} dialog
 */
export function closingDialog(dialog) {
	return new Promise((resolve) => {
		if (dialog) {
			// wait until the jQuery UI dialog has been closed
			dialog.$dialog.on('dialogclose', () => {
				resolve();
			});
		} else {
			resolve();
		}
	});
}

/**
 * Opens the given dialog, focuses the autocomplete input and triggers the search.
 * @param {MB.RE.Dialog} dialog 
 * @param {Event} [event] Affects the position of the opened dialog (optional).
 */
export function openDialogAndTriggerAutocomplete(dialog, event) {
	dialog.open(event);
	dialog.autocomplete.$input.focus();
	dialog.autocomplete.search();
}

/**
 * Returns the target entity of the given relationship dialog.
 * @param {MB.RE.Dialog} dialog 
 */
export function getTargetEntity(dialog) {
	return dialog.relationship().entities() // source and target entity
		.find((entity) => entity.entityType === dialog.targetType());
}

// TODO: drop once the new React relationship editor has been deployed
/** Resolves after the release relationship editor has finished loading. */
export function releaseLoadingFinished() {
	if (hasReactRelEditor()) return Promise.resolve();
	return waitFor(() => !MB.releaseRelationshipEditor.loadingRelease(), 100);
}
