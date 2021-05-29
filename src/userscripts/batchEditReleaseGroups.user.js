import { RG_EDIT_FIELDS } from '../MBS.js';
import {
	editReleaseGroup,
	extractMbids,
	replaceNamesByIds,
	buildEditNote,
	getReleaseGroupEditData,
} from '../editorTools.js';

/**
 * Enters edits for all selected entities using the form values for edit data, edit note and the "make votable" checkbox.
 */
async function editSelectedEntities() {
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

	const mbids = getSelectedMbids();
	displayStatus(`Submitting edits for ${mbids.length} release group(s)...`, true);
	clearErrorMessages();
	for (const mbid of mbids) {
		try {
			await editReleaseGroup(mbid, editData);
		} catch (error) {
			displayErrorMessage(error.message);
		}
	};
	displayStatus(`Submitted edits for ${mbids.length} release group(s).`);
}

/**
 * Loads the original edit data of the first selected entity into the form.
 */
async function loadFirstSelectedEntity() {
	const mbid = getSelectedMbids()[0];
	if (mbid) {
		displayStatus(`Loading edit data of ${mbid}...`, true);
		const editData = await getReleaseGroupEditData(mbid);
		loadEditData(editData);
		displayStatus(`Loaded edit data of “${editData.name}”.`);
	}
}

function getSelectedMbids() {
	const checkedItems = $('input[type=checkbox][name=add-to-merge]:checked').closest('tr');
	const entityUrls = $('a[href^="/release-group"]', checkedItems).map((_, a) => a.href).get();
	return extractMbids(entityUrls, 'release-group');
}

/**
 * Loads the given edit data object into the form as formatted JSON.
 * @param {Object} object Edit data.
 */
function loadEditData(object = {}) {
	$('#edit-data').val(JSON.stringify(object, null, 2));
}

function displayStatus(message, loading = false) {
	$('#userscript-status')
		.text(message)
		.toggleClass('loading-message', loading);
}

function displayErrorMessage(message) {
	$('#userscript-errors')
		.append(`<p>${message}</p>`);
}

function clearErrorMessages() {
	$('#userscript-errors').empty();
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
	<div id="userscript-status" class="row no-label"></div>
	<div id="userscript-errors" class="row no-label error">
		<p>Warning: This tool does not validate properties and values of the entered edit data and might lose existing values or submit unwanted changes as a side effect. Use at your own risk!</p>
		<p>Please work with small batches and make all edits votable to play it safe.</p>
	</div>
</form>
</details>`;

const styles =
`summary {
	color: #EB743B;
}
summary > h2 {
	display: inline;
}`;

function addEditDataTemplateButton(label, description, editData) {
	$(`<button type="button" title="Load JSON for “${description}”">${label}</button>`)
		.on('click', () => {
			loadEditData(editData);
			displayStatus(`Loaded edit data for “${description}”.`);
		})
		.appendTo('#batch-edit-tools .buttons');
}

function buildUI() {
	$(UI).appendTo('#content');
	$('<style type="text/css" id="batch-edit-styles">')
		.text(styles)
		.appendTo('head');

	// add buttons and attach click handlers
	$('<button type="button" class="positive">Edit selected entities</button>')
		.on('click', editSelectedEntities)
		.appendTo('#batch-edit-tools .buttons');
	$('<button type="button" title="Load JSON of the first selected entity">Load first entity</button>')
		.on('click', loadFirstSelectedEntity)
		.appendTo('#batch-edit-tools .buttons');
	addEditDataTemplateButton('Audiobook', 'Change types to Other + Audiobook', {
		primary_type_id: "Other",
		secondary_type_ids: "Audiobook",
	});
	addEditDataTemplateButton('Audio drama', 'Change types to Other + Audio drama', {
		primary_type_id: "Other",
		secondary_type_ids: "Audio drama",
	});

	// show supported properties and their types or value mappings as a tooltip
	$('#edit-data').attr('title', `Property types/mappings: ${JSON.stringify(RG_EDIT_FIELDS, null, 2)}`);
}

buildUI();
