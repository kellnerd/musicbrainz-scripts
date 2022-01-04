// ==UserScript==
// @name         MusicBrainz: Parse copyright text
// @version      2022.1.4
// @namespace    https://github.com/kellnerd/musicbrainz-bookmarklets
// @author       kellnerd
// @description  Parses copyright texts and assists the user to create release-label relationships for these.
// @homepageURL  https://github.com/kellnerd/musicbrainz-bookmarklets#parse-copyright-text
// @downloadURL  https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/parseCopyrightText.user.js
// @updateURL    https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/parseCopyrightText.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-bookmarklets/issues
// @grant        none
// @run-at       document-idle
// @match        *://*.musicbrainz.org/release/*/edit-relationships
// ==/UserScript==

(function () {
	'use strict';

	/**
	 * Adds the given message and a footer for the active userscript to the edit note.
	 * @param {string} message Edit note message.
	 */
	function addMessageToEditNote(message) {
		/** @type {HTMLTextAreaElement} */
		const editNoteInput = document.querySelector('#edit-note-text, .edit-note');
		const previousContent = editNoteInput.value.split(separator);
		editNoteInput.value = buildEditNote(...previousContent, message);
		editNoteInput.dispatchEvent(new Event('change'));
	}

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
			.join(separator);
	}

	const separator = '\n—\n';

	/**
	 * Searches for entities of the given type.
	 * @param {MB.EntityType} entityType 
	 * @param {string} query 
	 * @returns {Promise<MB.InternalEntity[]>}
	 */
	async function searchEntity(entityType, query) {
		const result = await fetch(`/ws/js/${entityType}?q=${encodeURIComponent(query)}`);
		return result.json();
	}

	/**
	 * Creates a dialog to add a relationship to the currently edited source entity.
	 * @param {MB.RE.Target<MB.RE.MinimalEntity>} targetEntity Target entity of the relationship.
	 * @returns {MB.RE.Dialog} Pre-filled "Add relationship" dialog object.
	 */
	function createAddRelationshipDialog(targetEntity) {
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
	 * Resolves after the given dialog has been closed.
	 * @param {MB.RE.Dialog} dialog
	 */
	function closingDialog(dialog) {
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
	function openDialogAndTriggerAutocomplete(dialog, event) {
		dialog.open(event);
		dialog.autocomplete.$input.focus();
		dialog.autocomplete.search();
	}

	/**
	 * Transforms the given value using the given substitution rules.
	 * @param {string} value 
	 * @param {(string|RegExp)[][]} substitutionRules Pairs of values for search & replace.
	 * @returns {string}
	 */
	function transform(value, substitutionRules) {
		substitutionRules.forEach(([searchValue, newValue]) => {
			value = value.replace(searchValue, newValue);
		});
		return value;
	}

	/** MBS relationship link type IDs (incomplete). */
	const LINK_TYPES = {
		release: {
			label: {
				'©': 708,
				'℗': 711,
				'licensed from': 712,
				'licensed to': 833,
				'marketed by': 848,
			},
		},
	};

	/**
	 * Extracts all copyright data and legal information from the given text.
	 * @param {string} text 
	 */
	function parseCopyrightText(text) {
		/** @type {CopyrightData[]} */
		const results = [];

		// standardize copyright text
		text = transform(text, [
			[/\(C\)/gi, '©'],
			[/\(P\)/gi, '℗'],
			[/«(.+?)»/g, '$1'], // remove a-tisket's French quotes
		]);

		const copyrightMatches = text.matchAll(/([©℗]|℗\s*[&+]\s*©)\s*(\d+)\s+([^.,]+)/g);
		for (const match of copyrightMatches) {
			const types = match[1].split(/[&+]/).map(cleanType);
			results.push({
				name: match[3],
				types,
				year: match[2],
			});
		}

		const legalInfoMatches = text.matchAll(/(licen[sc]ed (?:to|from)|marketed by)\s+([^.,]+)/ig);
		for (const match of legalInfoMatches) {
			results.push({
				name: match[2],
				types: [cleanType(match[1])],
			});
		}

		return results;
	}

	/**
	 * Creates and fills an "Add relationship" dialog for each piece of copyright information.
	 * Lets the user choose the appropriate target label and waits for the dialog to close before continuing with the next one.
	 * Automatically chooses the first search result and accepts the dialog in automatic mode.
	 * @param {CopyrightData[]} data List of copyright information.
	 * @param {boolean} [automaticMode] Automatic mode, disabled by default.
	 */
	async function addCopyrightRelationships(data, automaticMode = false) {
		for (const entry of data) {
			const entityType = 'label';
			const relTypes = LINK_TYPES.release[entityType];
			const targetEntity = MB.entity(automaticMode
				? (await searchEntity(entityType, entry.name))[0] // use the first result
				: { name: entry.name, entityType }
			);
			for (const type of entry.types) {
				const dialog = createAddRelationshipDialog(targetEntity);
				const rel = dialog.relationship();
				rel.linkTypeID(relTypes[type]);
				rel.entity0_credit(entry.name);
				if (entry.year) {
					rel.begin_date.year(entry.year);
					rel.end_date.year(entry.year);
				}

				if (automaticMode) {
					dialog.accept();
				} else {
					openDialogAndTriggerAutocomplete(dialog);
					await closingDialog(dialog);
				}
			}
		}
	}

	/**
	 * Cleans and standardizes the given free text type.
	 * @param {string} type 
	 */
	function cleanType(type) {
		return transform(type.toLowerCase().trim(), [
			['licence', 'license'],
		]);
	}

	/**
	 * @typedef {Object} CopyrightData
	 * @property {string} name Name of the copyright owner (label or artist).
	 * @property {string[]} types Types of copyright or legal information, will be mapped to relationship types.
	 * @property {string} [year] Numeric year, has to be a string with four digits, otherwise MBS complains.
	 */

	const addIcon = $('img', '.add-rel.btn').attr('src');

	const parseCopyrightButton =
`<span class="add-rel btn" id="parse-copyright" title="ALT key for automatic matching">
	<img class="bottom" src="${addIcon}">
	Parse copyright text
</span>`	;

	function buildUI() {
		$(parseCopyrightButton)
			.on('click', async (event) => {
				const input = prompt('Copyright text:');
				if (input) {
					const copyrightData = parseCopyrightText(input);
					const automaticMode = event.altKey;
					await addCopyrightRelationships(copyrightData, automaticMode);
					addMessageToEditNote(input);
				}
			})
			.appendTo('#release-rels');
	}

	buildUI();

}());
