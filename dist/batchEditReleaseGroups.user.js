// ==UserScript==
// @name         MusicBrainz: Batch‐edit release groups
// @version      2021.4.26
// @namespace    https://github.com/kellnerd/musicbrainz-bookmarklets
// @author       kellnerd
// @description  Batch‐edit selected release groups from artist’s overview pages.
// @homepageURL  https://github.com/kellnerd/musicbrainz-bookmarklets#batch-edit-release-groups
// @downloadURL  https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/batchEditReleaseGroups.user.js
// @updateURL    https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/batchEditReleaseGroups.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-bookmarklets/issues
// @grant        GM_info
// @include      /^https?:\/\/(\w+\.)?musicbrainz\.org\/artist\/[a-f0-9-]{36}(\?page=\d+)?$/
// ==/UserScript==

(function () {
	'use strict';

	/**
	 * Dictionary of supported edit data properties for release groups.
	 * Contains their types or mappings of their possible named values to internal IDs.
	 */
	const RG_EDIT_FIELDS = {
		name: 'string',
		artist_credit: 'object',
		comment: 'string | null',
		primary_type_id: {
			'Album': 1,
			'Single': 2,
			'EP': 3,
			'Broadcast': 12,
			'Other': 11,
		},
		secondary_type_ids: {
			'Audio drama': 11,
			'Audiobook': 5,
			'Compilation': 1,
			'Demo': 10,
			'DJ-mix': 8,
			'Interview': 4,
			'Live': 6,
			'Mixtape/Street': 9,
			'Remix': 7,
			'Soundtrack': 2,
			'Spokenword': 3,
		},
		rel: 'array',
		edit_note: 'string | null',
		make_votable: 'number(boolean) | null',
	};

	/**
	 * Maps edit data properties of release groups to the corresponding source data properties.
	 */
	const RG_SOURCE_DATA = {
		name: 'name',
		// artist_credit: null,
		comment: 'comment',
		primary_type_id: 'typeID',
		secondary_type_ids: 'secondaryTypeIDs',
		// rel: null,
	};

	/**
	 * Flattens the given (deep) object to a single level hierarchy.
	 * Concatenates the keys in a nested structure which lead to a value with dots.
	 * @param {Object} object 
	 * @param {string[]} preservedKeys Keys whose values will be preserved.
	 * @returns {Object}
	 */
	function flatten(object, preservedKeys = []) {
		let flatObject = {};
		for (let key in object) {
			let value = object[key];
			if (typeof value === 'object' && value !== null && !preservedKeys.includes(key)) { // also matches arrays
				value = flatten(value, preservedKeys);
				for (let childKey in value) {
					flatObject[key + '.' + childKey] = value[childKey]; // concatenate keys
				}
			} else { // value is already flat (e.g. a string) or should be preserved
				flatObject[key] = value; // keep the key
			}
		}
		return flatObject;
	}

	/**
	 * Creates a custom `URLSearchParams` object where each array is serialized into multiple parameters with the same name
	 * instead of a single parameter with concatenated values (e.g. `{ a: [1, 2] }` becomes `a=1&a=2` instead of `a=1,2`).
	 * @param {Object} params Dictionary of parameters.
	 * @returns {URLSearchParams}
	 */
	function multiUrlSearchParams(params) {
		const searchParams = new URLSearchParams();
		for (let name in params) {
			const value = params[name];
			if (Array.isArray(value)) {
				value.forEach((value) => searchParams.append(name, value));
			} else {
				searchParams.append(name, value);
			}
		}
		return searchParams;
	}

	/**
	 * Sends an edit request for the given release group to MBS.
	 * @param {string} mbid MBID of the release group.
	 * @param {Object} editData Properties of the release group and their new values.
	 * @returns {Promise<boolean>}
	 */
	async function editReleaseGroup(mbid, editData) {
		const editUrl = buildEditUrl('release-group', mbid);

		// build body of the edit request and preserve values of unaffected properties
		const sourceData = await fetchEditSourceData(editUrl);
		const editBody = flatten({
			'edit-release-group': {
				...parseSourceData(sourceData), // preserve old values (MBS discards some of them if they are missing)
				make_votable: 1,
				edit_note: buildEditNote(),
				...editData, // can also be used to overwrite the above defaults
			}
		}, ['secondary_type_ids']);

		// submit edit request
		const response = await fetch(editUrl, {
			method: 'POST',
			body: multiUrlSearchParams(editBody),
		});
		if (response.redirected) {
			return true;
		} else {
			console.error(`Failed to edit '${sourceData.name}' (MBS did not redirect)`);
			return false;
		}
	}

	/**
	 * Replaces the names of various type values by their internal IDs.
	 * @param {Object} editData Edit data.
	 * @returns {Object} Raw edit data.
	 */
	function replaceNamesByIds(editData) {
		for (let property in editData) {
			let value = editData[property];
			if (property in RG_EDIT_FIELDS) { // known property
				const nameToId = RG_EDIT_FIELDS[property];
				if (typeof nameToId === 'object' && nameToId !== null) { // mapping exists for this property
					if (Array.isArray(value)) {
						value = value.map((value) => (nameToId[value] || value));
					} else {
						value = nameToId[value] || value; // fallback: use the (possibly numerical) value as-is
					}
				}
			} else if (typeof value === 'object' && value !== null) { // recursively scan the edit data object
				value = replaceNamesByIds(value);
			}
			editData[property] = value;
		}
		return editData;
	}

	/**
	 * Builds an edit note for the given message, including information about the active userscript.
	 * @param {string} message Edit note message (optional).
	 * @returns {string}
	 */
	function buildEditNote(message = '') {
		let scriptInfo = '';
		if (typeof GM_info !== 'undefined') {
			scriptInfo = `${GM_info.script.name} (${GM_info.script.version})`;
		}
		const lines = [message, scriptInfo];
		return lines.filter((line) => line).join('\n—\n');
	}

	/**
	 * Builds the URL to the MBS edit page of the given entity.
	 * @param {string} entityType Type of the entity.
	 * @param {string} mbid MBID of the entity.
	 * @returns {string}
	 */
	function buildEditUrl(entityType, mbid) {
		return `/${entityType}/${mbid}/edit`;
	}

	/**
	 * Fetches the given edit page and extracts the JSON edit source data of the entity from it.
	 * @param {string} editUrl URL of the entity edit page.
	 * @returns {Promise<Object>} JSON edit source data.
	 */
	async function fetchEditSourceData(editUrl) {
		const response = await fetch(editUrl);
		const [, sourceData] = /sourceData: (.*),\n/.exec(await response.text());
		return JSON.parse(sourceData);
	}

	/**
	 * Parses edit source data of the entity and builds the relevant default edit data.
	 * @param {Object} sourceData JSON edit source data.
	 * @returns {Object} JSON edit data.
	 */
	function parseSourceData(sourceData) {
		const editData = {};
		for (let property in RG_SOURCE_DATA) {
			const value = sourceData[RG_SOURCE_DATA[property]];
			if (value) {
				editData[property] = value;
			}
		}
		return editData;
	}

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
</details>`	;

	const styles =
`summary {
	color: #EB743B;
}
summary > h2 {
	display: inline;
}`	;

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

}());
