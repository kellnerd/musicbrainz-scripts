import { RG_EDIT_FIELDS } from '../MBS.js';
import {
	editReleaseGroup,
	replaceNamesByIds,
	buildEditNote,
} from '../editorTools.js';

/**
 * Enters edits for all selected entities using the form values for edit data, edit note and the "make votable" checkbox.
 */
function editSelectedEntities() {
	// get MBIDs of all selected entities
	const checkedItems = $('input[type=checkbox][name=add-to-merge]:checked').closest('tr');
	const mbids = checkedItems.map((_, tr) => tr.id).get(); // relies on a script by @jesus2099

	// parse edit data form input
	let editData;
	try {
		editData = JSON.parse($('#edit-data').val());
	} catch (error) {
		alert(error.message);
		return;
	}
	loadEditData(editData); // re-format JSON of the form input

	// prepare raw edit data as it is expected by MBS
	editData = replaceNamesByIds(editData);
	editData.edit_note = buildEditNote($('#edit-note').val());
	editData.make_votable = Number($('#make-votable').is(':checked'));

	console.debug(editData);
	mbids.forEach((mbid) => editReleaseGroup(mbid, editData));
}

/**
 * Loads the given edit data object into the form as formatted JSON.
 * @param {Object} object Edit data.
 */
function loadEditData(object = {}) {
	$('#edit-data').val(JSON.stringify(object, null, 2));
}

const UI =
`<details id="batch-edit-tools" open>
<summary>
	<h2>Batch‐edit release groups</h2>
</summary>
<form>
	<div class="row">
		<label for="edit-data" class="required">Edit data (JSON):</label>
		<textarea id="edit-data" name="edit_data" cols="80" rows="5"></textarea>
	</div>
	<div class="row">
		<label for="edit-note">Edit note:</label>
		<textarea id="edit-note" name="edit_note" cols="80" rows="2" class="edit-note"></textarea>
	</div>
	<div class="row no-label">
		<div class="auto-editor">
			<input id="make-votable" name="make_votable" type="checkbox" value="1">
			<label class="inline" for="make-votable">Make all edits votable.</label>        
		</div>
	</div>
	<div class="row no-label buttons"></div>
</form>
</details>`;

const styles =
`summary {
	color: #EB743B;
}
summary > h2 {
	display: inline;
}`;

function buildUI() {
	$(UI).appendTo('#content');
	$('<style type="text/css" id="batch-edit-styles">')
		.text(styles)
		.appendTo('head');

	// add buttons and attach click handlers
	$('<button type="button" class="positive">Edit selected entities</button>')
		.on('click', editSelectedEntities)
		.appendTo('#batch-edit-tools .buttons');
	$('<button type="button" title="Load JSON for “Change types to Other + Audiobook”">Audiobook</button>')
		.on('click', () => loadEditData({
			primary_type_id: "Other",
			secondary_type_ids: "Audiobook",
		}))
		.appendTo('#batch-edit-tools .buttons');
	$('<button type="button" title="Load JSON for “Change types to Other + Audio drama”">Audio drama</button>')
		.on('click', () => loadEditData({
			primary_type_id: "Other",
			secondary_type_ids: "Audio drama",
		}))
		.appendTo('#batch-edit-tools .buttons');

	// show supported properties and their types or value mappings as a tooltip
	$('#edit-data').attr('title', `Property types/mappings: ${JSON.stringify(RG_EDIT_FIELDS, null, 2)}`);
}

buildUI();
