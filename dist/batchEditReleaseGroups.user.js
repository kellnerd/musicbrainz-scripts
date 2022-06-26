// ==UserScript==
// @name         MusicBrainz: Batch‐edit release groups
// @version      2022.6.26
// @namespace    https://github.com/kellnerd/musicbrainz-scripts
// @author       kellnerd
// @description  Batch‐edit selected release groups from artist’s overview pages.
// @homepageURL  https://github.com/kellnerd/musicbrainz-scripts#batch-edit-release-groups
// @downloadURL  https://raw.github.com/kellnerd/musicbrainz-scripts/batch-edit/dist/batchEditReleaseGroups.user.js
// @updateURL    https://raw.github.com/kellnerd/musicbrainz-scripts/batch-edit/dist/batchEditReleaseGroups.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-scripts/issues
// @grant        none
// @include      /^https?://((beta|test)\.)?musicbrainz\.org/artist/[0-9a-f-]{36}(\?.+?)?(#.+?)?$/
// ==/UserScript==

(function () {
	'use strict';

	/**
	 * Builds an edit note for the given message sections and adds a footer section for the active userscript.
	 * Automatically de-duplicates the sections to reduce auto-generated message and footer spam.
	 * @param {...string} sections Edit note sections.
	 * @returns {string} Complete edit note content.
	 */
	function buildEditNote(...sections) {
		sections = sections.map((section) => section.trim());

		if (typeof GM_info !== 'undefined') {
			sections.push(`${GM_info.script.name} (v${GM_info.script.version}, ${GM_info.script.namespace})`);
		}

		// drop empty sections and keep only the last occurrence of duplicate sections
		return sections
			.filter((section, index) => section && sections.lastIndexOf(section) === index)
			.join(editNoteSeparator);
	}

	const editNoteSeparator = '\n—\n';

	const MBID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

	/**
	 * Extracts MBIDs from the given URLs.
	 * @param  {string[]} urls
	 * @param  {MB.EntityType} entityType Filter URLs by entity type (optional).
	 * @param {boolean} unique Removes duplicate MBIDs from the results (optional).
	 * @returns {string[]} Array of valid MBIDs.
	 */
	function extractMBIDs(urls, entityType = '', unique = false) {
		const pattern = new RegExp(`${entityType}/(${MBID_REGEX.source})(?:$|\/|\?)`);
		const MBIDs = urls
			.map((url) => url.match(pattern)?.[1]) // returns first capture group or `undefined`
			.filter((mbid) => mbid); // remove undefined MBIDs
		if (unique) {
			return [...new Set(MBIDs)];
		} else {
			return MBIDs;
		}
	}

	/**
	 * Builds the URL to the MBS edit page of the given entity.
	 * @param {MB.EntityType} entityType Type of the entity.
	 * @param {string} mbid MBID of the entity.
	 * @returns {string}
	 */
	function buildEditUrl(entityType, mbid) {
		return `/${entityType}/${mbid}/edit`;
	}

	const primaryTypeIds = {
		'Album': 1,
		'Single': 2,
		'EP': 3,
		'Broadcast': 12,
		'Other': 11,
	};

	const secondaryTypeIds = {
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
	};

	/**
	 * Dictionary of supported edit data properties for release groups.
	 * Contains their types or mappings of their possible named values to internal IDs.
	 */
	const RG_EDIT_FIELDS = {
		name: 'string',
		artist_credit: 'object',
		comment: 'string | null',
		primary_type_id: primaryTypeIds,
		secondary_type_ids: secondaryTypeIds,
		rel: 'array',
		url: 'array',
		edit_note: 'string | null',
		make_votable: 'number(boolean) | null',
	};

	/**
	 * Maps edit data properties of release groups to the corresponding source data properties.
	 */
	const RG_SOURCE_DATA = {
		name: 'name',
		// artist_credit: separate parser
		comment: 'comment',
		primary_type_id: 'typeID',
		secondary_type_ids: 'secondaryTypeIDs',
		// rel: separate parser
		// url: separate parser (same as for rel)
	};

	/**
	 * Contains all relevant edit data properties of attributes (which are named the same as the corresponding source data properties).
	 */
	const ATTRIBUTE_DATA = [
		'type', // contains a `gid` property (MBID of the attribute)
		'typeName', // redundant (ignored by MBS), just for convenience (TODO: replace by a UI "translation")
		'text_value', // only exists if "free_text" is true
		'credited_as', // only exists if "creditable" is true (used for instrument/vocal type credits)
	];

	/**
	 * Flattens the given (deep) object to a single level hierarchy.
	 * Concatenates the keys in a nested structure which lead to a value with dots.
	 * @param {object} object 
	 * @param {string[]} preservedKeys Keys whose values will be preserved.
	 * @returns {object}
	 */
	function flatten(object, preservedKeys = []) {
		const flatObject = {};

		for (const key in object) {
			let value = object[key];
			if (typeof value === 'object' && value !== null && !preservedKeys.includes(key)) { // also matches arrays
				value = flatten(value, preservedKeys);
				for (const childKey in value) {
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
	 */
	function urlSearchMultiParams(params) {
		const searchParams = new URLSearchParams();
		for (const name in params) {
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
	 * Gets the default edit data for the given release group.
	 * @param {string} mbid MBID of the release group.
	 * @returns {Promise<Object>}
	 */
	async function getReleaseGroupEditData(mbid) {
		const editUrl = buildEditUrl('release-group', mbid);
		const sourceData = await fetchEditSourceData(editUrl);
		return parseSourceData(sourceData, true);
	}

	/**
	 * Sends an edit request for the given release group to MBS.
	 * @param {string} mbid MBID of the release group.
	 * @param {Object} editData Properties of the release group and their new values.
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
			body: urlSearchMultiParams(editBody),
		});
		if (!response.redirected) {
			throw new Error(`Failed to edit “${sourceData.name}” (MBS did not redirect).`);
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
	 * Fetches the given edit page and extracts the JSON edit source data of the entity from it.
	 * @param {string} editUrl URL of the entity edit page.
	 * @returns {Promise<Object>} JSON edit source data.
	 */
	async function fetchEditSourceData(editUrl) {
		const response = await fetch(editUrl);
		const sourceData = /sourceData: (.*),\n/.exec(await response.text())?.[1];
		return JSON.parse(sourceData);
	}

	/**
	 * Parses edit source data of the entity and builds the relevant default edit data.
	 * @param {Object} sourceData JSON edit source data.
	 * @param {boolean} parseOptionalProps Enables parsing of artist credits, relationships and URLs.
	 * @returns {Object} JSON edit data.
	 */
	function parseSourceData(sourceData, parseOptionalProps = false) {
		let editData = {};
		for (let property in RG_SOURCE_DATA) {
			const sourceKey = RG_SOURCE_DATA[property];
			const value = sourceData[sourceKey];
			if (value) {
				editData[property] = value;
			}
		}
		if (parseOptionalProps) {
			editData = {
				...editData,
				artist_credit: parseArtistCreditSourceData(sourceData),
				...parseRelationshipSourceData(sourceData),
			};
		}
		return editData;
	}

	/**
	 * Parses edit source data for the artist credit and builds the relevant default edit data of the artist credit.
	 * @param {Object} sourceData JSON edit source data.
	 * @returns {{names:[]}} JSON artist credit edit data.
	 */
	function parseArtistCreditSourceData(sourceData) {
		return {
			names: sourceData.artistCredit.names.map((name) => ({
				name: name.name, // name as credited
				join_phrase: name.joinPhrase,
				artist: {
					id: name.artist.id, // internal ID
					name: name.artist.name, // redundant, has no effect
				}
			}))
		};
	}

	/**
	 * Parses edit source data for relationships/URLs and builds their relevant default edit data.
	 * @param {Object} sourceData JSON edit source data.
	 * @returns {{url:Array,rel:Array}} JSON edit data.
	 */
	function parseRelationshipSourceData(sourceData) {
		// these are optional edit data properties, empty arrays will be removed during flattening
		const editData = {
			rel: [],
			url: [],
		};
		sourceData.relationships.forEach((rel) => {
			const relData = {
				relationship_id: rel.id, // internal ID, left out for new relationships
				link_type_id: rel.linkTypeID, // internal ID of the rel type, always required
				verbosePhrase: rel.verbosePhrase, // redundant (ignored by MBS), just for convenience (TODO: replace by a UI "translation")
			};
			if (rel.target_type === 'url') {
				relData.text = rel.target.name; // URL itself
				editData.url.push(relData); // TODO: URL array index does not start with 0 in MBS requests!?
			} else {
				relData.target = rel.target.gid; // MBID of the target entity
				relData.backward = Number(rel.direction === 'backward'); // defaults to 0, requires `target` on change
				// all of the following relationship properties are optional (TODO: leave out if empty?)
				relData.attributes = rel.attributes.map(parseAttributeSourceData);
				relData.period = buildDatePeriod(rel.begin_date, rel.end_date, rel.ended);
				relData.entity0_credit = rel.entity0_credit;
				relData.entity1_credit = rel.entity1_credit;
				editData.rel.push(relData);
			}
		});
		return editData;
	}

	function parseAttributeSourceData(attribute) {
		const result = {};
		// copy relevant properties if they exist
		ATTRIBUTE_DATA.forEach((property) => {
			const value = attribute[property];
			if (value) {
				result[property] = value;
			}
		});
		return result;
	}

	function buildDatePeriod(begin_date = null, end_date = null, ended = false) {
		if (begin_date || end_date || ended) {
			[begin_date, end_date].filter((x) => x !== null).forEach((date) => {
				['year', 'month', 'day'].forEach((property) => {
					date[property] ??= ''; // MBS expects an empty string instead of null
				});
			});
			return {
				begin_date,
				end_date,
				ended: Number(Boolean(ended)),
			};
		} else {
			return {}; // empty objects will be removed during flattening
		}
	}

	/**
	 * Enters edits for all selected entities using the form values for edit data, edit note and the "make votable" checkbox.
	 */
	async function editSelectedEntities() {
		// parse edit data form input
		let editData;
		clearErrorMessages();
		try {
			editData = JSON.parse($('#edit-data').val());
		} catch (error) {
			displayErrorMessage(error.message);
			return;
		}
		loadEditData(editData); // re-format JSON of the form input

		// prepare raw edit data as it is expected by MBS
		editData = replaceNamesByIds(editData);
		const debugData = $('#debug-mode').is(':checked') ? JSON.stringify(editData) : undefined;
		editData.edit_note = buildEditNote($('#edit-note').val(), debugData);
		editData.make_votable = Number($('#make-votable').is(':checked'));

		const mbids = getSelectedMbids();
		const totalRequests = mbids.length;
		for (let i = 0; i < totalRequests; i++) {
			displayStatus(`Submitting edits (${i} of ${totalRequests}) ...`, true);
			try {
				await editReleaseGroup(mbids[i], editData);
			} catch (error) {
				displayErrorMessage(error.message);
			}
		}
		displayStatus(`Submitted edits for ${totalRequests} release group${totalRequests != 1 ? 's' : ''}.`);
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
		const checkedItems = $('input[type=checkbox][name=add-to-merge]:checked').closest('tr');
		const entityUrls = $('a[href^="/release-group"]', checkedItems).map((_, a) => a.href).get();
		return extractMBIDs(entityUrls, 'release-group', true);
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

	const isProductionServer = ['musicbrainz.org', 'beta.musicbrainz.org'].includes(window.location.hostname);

	const UI =
`<details id="batch-edit-tools" ${isProductionServer ? '' : 'open'}>
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
		<input id="debug-mode" name="debug_mode" type="checkbox" value="1" ${isProductionServer ? '' : 'checked'}>
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
</details>`	;

	const styles =
`summary {
	color: #EB743B;
	cursor: pointer;
}
summary > h2 {
	display: inline;
}`	;

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

})();