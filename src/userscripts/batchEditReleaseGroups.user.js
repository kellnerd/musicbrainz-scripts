import { buildEditNote } from '../editNote.js';
import { extractMBIDs } from '../entity.js';
import { RG_EDIT_FIELDS } from '../data/releaseGroup.js';
import {
	editReleaseGroup,
	replaceNamesByIds,
	getReleaseGroupEditData,
} from '../editorTools.js';
import { delay } from '../../utils/async/delay.js';
import { createElement, injectStylesheet } from '../../utils/dom/create.js';
import { dom, qs, qsa } from '../../utils/dom/select.js';
import {
	persistCheckbox,
	persistDetails,
	persistInput,
} from '../../utils/userscript/persistElement.js'

/**
 * Enters edits for all selected entities using the form values for edit data, edit note and the "make votable" checkbox.
 */
async function editSelectedEntities() {
	// parse edit data form input
	let editData;
	clearErrorMessages();
	try {
		editData = JSON.parse(dom('edit-data').value);
	} catch (error) {
		displayErrorMessage(error.message);
		return;
	}
	loadEditData(editData); // re-format JSON of the form input

	// prepare raw edit data as it is expected by MBS
	editData = replaceNamesByIds(editData);
	const debugData = dom('debug-mode').checked ? JSON.stringify(editData) : undefined;
	editData.edit_note = buildEditNote(dom('edit-note').value, debugData);
	editData.make_votable = Number(dom('make-votable').checked);
	console.debug(editData);

	const mbids = getSelectedMbids();

	// submit all edit requests at once, they are concurrency-limited
	displayStatus(`Submitting edits ...`, true);
	const pendingEdits = mbids.map((mbid) => editReleaseGroup(mbid, editData));
	const totalEdits = pendingEdits.length;

	// update status after each completed edit and display potential errors
	let completedEdits = 0;
	pendingEdits.forEach((pendingEdit) => {
		pendingEdit.then(() => {
			completedEdits++;
			displayStatus(`Submitting edits (${completedEdits} of ${totalEdits})`, true);
		}).catch((error) => {
			displayErrorMessage(error.message);
		});
	});

	// wait for all edits to be completed (or to fail)
	await Promise.allSettled(pendingEdits);
	await delay(0); // wait for the callback of the last pending edit to update `completedEdits`
	displayStatus(`Submitted edits for ${completedEdits} release group${completedEdits != 1 ? 's' : ''}.`);
}

/**
 * Loads the original edit data of the first selected entity into the form.
 */
async function loadFirstSelectedEntity() {
	const mbid = getSelectedMbids()[0];
	if (mbid) {
		displayStatus(`Loading edit data of ${mbid} ...`, true);
		const editData = await getReleaseGroupEditData(mbid);
		loadEditData(editData);
		displayStatus(`Loaded edit data of “${editData.name}”.`);
	}
}

function getSelectedMbids() {
	const checkedItemURLs = Array.from(qsa('input[type=checkbox][name=add-to-merge]:checked')).map((checkbox) => {
		const row = checkbox.closest('tr');
		return qs('a[href^="/release-group"]', row).href;
	});
	return extractMBIDs(checkedItemURLs, 'release-group', true);
}

/**
 * Loads the given edit data object into the form as formatted JSON.
 * @param {Object} object Edit data.
 */
function loadEditData(object = {}) {
	const editDataInput = dom('edit-data');
	editDataInput.value = JSON.stringify(object, null, 2);
	editDataInput.dispatchEvent(new Event('change'));
}

function displayStatus(message, loading = false) {
	const statusElement = dom('userscript-status');
	statusElement.innerText = message;
	statusElement.classList.toggle('loading-message', loading);
}

function displayErrorMessage(message) {
	dom('userscript-errors').insertAdjacentHTML('beforeend', `<p>${message}</p>`);
}

function clearErrorMessages() {
	dom('userscript-errors').innerHTML = '';
}

const UI = `
<details id="batch-edit-tools">
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
		<input id="debug-mode" name="debug_mode" type="checkbox" value="1">
		<label class="inline" for="debug-mode">Include edit data (minified JSON) in edit notes.</label>
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

const styles = `
details#batch-edit-tools summary {
	cursor: pointer;
	display: block;
}
details#batch-edit-tools summary > h2 {
	display: list-item;
}`;

function addEditDataTemplateButton(label, description, editData) {
	const button = createElement(`<button type="button" title="Load JSON for “${description}”">${label}</button>`);
	button.addEventListener('click', () => {
		loadEditData(editData);
		displayStatus(`Loaded edit data for “${description}”.`);
	});
	qs('#batch-edit-tools .buttons').append(button);
}

function buildUI() {
	dom('content').insertAdjacentHTML('beforeend', UI);
	injectStylesheet(styles, 'batch-edit');
	const editDataInput = dom('edit-data');

	// add buttons and attach click handlers
	const editButton = createElement('<button type="button" class="positive">Edit selected entities</button>');
	const loadButton = createElement('<button type="button" title="Load JSON of the first selected entity">Load first entity</button>');
	editButton.addEventListener('click', editSelectedEntities);
	loadButton.addEventListener('click', loadFirstSelectedEntity);
	qs('#batch-edit-tools .buttons').append(editButton, loadButton);

	addEditDataTemplateButton('Audiobook', 'Change types to Other + Audiobook', {
		primary_type_id: "Other",
		secondary_type_ids: "Audiobook",
	});
	addEditDataTemplateButton('Audio drama', 'Change types to Other + Audio drama', {
		primary_type_id: "Other",
		secondary_type_ids: "Audio drama",
	});

	// show supported properties and their types or value mappings as a tooltip
	editDataInput.title = `Property types/mappings: ${JSON.stringify(RG_EDIT_FIELDS, null, 2)}`;

	persistDetails('batch-edit-tools', true);
	persistCheckbox('debug-mode');
	persistCheckbox('make-votable');
	persistInput(editDataInput);
	persistInput(dom('edit-note'));
}

buildUI();
