// ==UserScript==
// @name         MusicBrainz: Batch‐edit release groups
// @version      2022.7.3
// @namespace    https://github.com/kellnerd/musicbrainz-scripts
// @author       kellnerd
// @description  Batch‐edit selected release groups from artist’s overview pages.
// @homepageURL  https://github.com/kellnerd/musicbrainz-scripts#batch-edit-release-groups
// @downloadURL  https://raw.github.com/kellnerd/musicbrainz-scripts/batch-edit/dist/batchEditReleaseGroups.user.js
// @updateURL    https://raw.github.com/kellnerd/musicbrainz-scripts/batch-edit/dist/batchEditReleaseGroups.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-scripts/issues
// @grant        GM.getValue
// @grant        GM.setValue
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
		sections = sections.map((section) => section?.trim());

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
		const pattern = new RegExp(String.raw`${entityType}/(${MBID_REGEX.source})(?:$|\/|\?)`);
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
	 * Returns a promise that resolves after the given delay.
	 * @param {number} ms Delay in milliseconds.
	 */
	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Adapted from https://thoughtspile.github.io/2018/07/07/rate-limit-promises/

	function queue(operation) {
		let queue = Promise.resolve(); // empty queue is ready
		return (...args) => {
			// queue the next operation, regardless of the last operation's success
			queue = queue.then(() => operation(...args), () => operation(...args));
			return queue; // now points to the result of the just enqueued operation
		};
	}

	/**
	 * Limits the number of simultaneous requests for the given operation.
	 * @template Params
	 * @template Result
	 * @param {(...args:Params)=>Result} operation Operation that should be limited in its use.
	 * @param {number} concurrency Maximum number of concurrent requests at any time.
	 * @returns {(...args:Params)=>Promise<Result>} Concurrency-limited version of the given operation.
	 */
	function limit(operation, concurrency = 1) {
		if (concurrency == 1) {
			return queue(operation);
		}
		const queues = Array(concurrency).fill().map(() => queue(operation));
		let queueIndex = 0;
		return (...args) => {
			queueIndex = (queueIndex + 1) % concurrency; // use the next queue
			return queues[queueIndex](...args); // return the result of the operation
		};
	}

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

	// Limit editing to 5 concurrent edits
	const editReleaseGroup = limit(_editReleaseGroup, 5);

	/**
	 * Sends an edit request for the given release group to MBS.
	 * @param {string} mbid MBID of the release group.
	 * @param {Object} editData Properties of the release group and their new values.
	 */
	async function _editReleaseGroup(mbid, editData) {
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
	 * Creates a DOM element from the given HTML fragment.
	 * @param {string} html HTML fragment.
	 */
	function createElement(html) {
		const template = document.createElement('template');
		template.innerHTML = html;
		return template.content.firstElementChild;
	}

	/**
	 * Creates a style element from the given CSS fragment and injects it into the document's head.
	 * @param {string} css CSS fragment.
	 * @param {string} userscriptName Name of the userscript, used to generate an ID for the style element.
	 */
	function injectStylesheet(css, userscriptName) {
		const style = document.createElement('style');
		if (userscriptName) {
			style.id = [userscriptName, 'userscript-css'].join('-');
		}
		style.innerText = css;
		document.head.append(style);
	}

	/**
	 * Returns a reference to the first DOM element with the specified value of the ID attribute.
	 * @param {string} elementId String that specifies the ID value.
	 */
	function dom(elementId) {
		return document.getElementById(elementId);
	}

	/**
	 * Returns the first element that is a descendant of node that matches selectors.
	 * @param {string} selectors 
	 * @param {ParentNode} node 
	 */
	function qs(selectors, node = document) {
		return node.querySelector(selectors);
	}

	/**
	 * Returns all element descendants of node that match selectors.
	 * @param {string} selectors 
	 * @param {ParentNode} node 
	 */
	function qsa(selectors, node = document) {
		return node.querySelectorAll(selectors);
	}

	/**
	 * Persists the desired attribute of the given element across page loads and origins.
	 * @param {HTMLElement} element 
	 * @param {keyof HTMLElement} attribute 
	 * @param {keyof HTMLElementEventMap} eventType
	 * @param {string|number|boolean} [defaultValue] Default value of the attribute.
	 */
	async function persistElement(element, attribute, eventType, defaultValue) {
		if (!element.id) {
			throw new Error('Can not persist an element without ID');
		}

		const key = ['persist', element.id, attribute].join('.');

		// initialize attribute
		const persistedValue = await GM.getValue(key, defaultValue);
		if (persistedValue) {
			element[attribute] = persistedValue;
		}

		// persist attribute once the event occurs
		element.addEventListener(eventType, () => {
			GM.setValue(key, element[attribute]);
		});

		return element;
	}

	/**
	 * Persists the state of the checkbox with the given ID across page loads and origins.
	 * @param {string} id 
	 * @param {boolean} [checkedByDefault]
	 * @returns {Promise<HTMLInputElement>}
	 */
	function persistCheckbox(id, checkedByDefault) {
		return persistElement(dom(id), 'checked', 'change', checkedByDefault);
	}

	/**
	 * Persists the state of the collapsible details container with the given ID across page loads and origins.
	 * @param {string} id 
	 * @param {boolean} [openByDefault]
	 * @returns {Promise<HTMLDetailsElement>}
	 */
	function persistDetails(id, openByDefault) {
		return persistElement(dom(id), 'open', 'toggle', openByDefault);
	}

	/**
	 * Persists the value of the given input field across page loads and origins.
	 * @param {HTMLInputElement|HTMLTextAreaElement} element 
	 * @param {string} [defaultValue]
	 * @returns {Promise<HTMLInputElement>}
	 */
	function persistInput(element, defaultValue) {
		return persistElement(element, 'value', 'change', defaultValue);
	}

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

	const UI =
`<details id="batch-edit-tools">
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

})();
