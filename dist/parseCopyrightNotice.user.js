// ==UserScript==
// @name         MusicBrainz: Parse copyright notice
// @version      2022.1.5
// @namespace    https://github.com/kellnerd/musicbrainz-bookmarklets
// @author       kellnerd
// @description  Parses copyright notices and assists the user to create release-label relationships for these.
// @homepageURL  https://github.com/kellnerd/musicbrainz-bookmarklets#parse-copyright-notice
// @downloadURL  https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/parseCopyrightNotice.user.js
// @updateURL    https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/parseCopyrightNotice.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-bookmarklets/issues
// @grant        none
// @run-at       document-idle
// @match        *://*.musicbrainz.org/release/*/edit-relationships
// ==/UserScript==

(function () {
	'use strict';

	/**
	 * @template Params
	 * @template Result
	 */
	class FunctionCache {
		/**
		 * @param {(...params: Params) => Result | Promise<Result>} expensiveFunction Expensive function whose results should be cached.
		 * @param {Object} options
		 * @param {(...params: Params) => string[]} options.keyMapper Maps the function parameters to the components of the cache's key.
		 * @param {string} [options.name] Name of the cache, used as storage key (optional).
		 * @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
		 * @param {Record<string, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
		 */
		constructor(expensiveFunction, options) {
			this.expensiveFunction = expensiveFunction;
			this.keyMapper = options.keyMapper;
			this.name = options.name ?? `defaultCache`;
			this.storage = options.storage;
			this.data = options.data ?? {};
		}

		/**
		 * Looks up the result for the given parameters and returns it.
		 * If the result is not cached, it will be calculated and added to the cache.
		 * @param {Params} params 
		 */
		async get(...params) {
			const keys = this.keyMapper(...params);
			const lastKey = keys.pop();
			if (!lastKey) return;

			const record = this._get(keys);
			if (record[lastKey] === undefined) {
				// create a new entry to cache the result of the expensive function
				const newEntry = await this.expensiveFunction(...params);
				if (newEntry !== undefined) {
					record[lastKey] = newEntry;
				}
			}

			return record[lastKey];
		}

		/**
		 * Manually sets the cache value for the given key.
		 * @param {string[]} keys Components of the key.
		 * @param {Result} value 
		 */
		set(keys, value) {
			const lastKey = keys.pop();
			this._get(keys)[lastKey] = value;
		}

		/**
		 * Loads the persisted cache entries.
		 */
		load() {
			const storedData = this.storage?.getItem(this.name);
			if (storedData) {
				this.data = JSON.parse(storedData);
			}
		}

		/**
		 * Persists all entries of the cache.
		 */
		store() {
			this.storage?.setItem(this.name, JSON.stringify(this.data));
		}

		/**
		 * Clears all entries of the cache and persists the changes.
		 */
		clear() {
			this.data = {};
			this.store();
		}

		/**
		 * Returns the cache record which is indexed by the key.
		 * @param {string[]} keys Components of the key
		 */
		_get(keys) {
			let record = this.data;
			keys.forEach((key) => {
				if (record[key] === undefined) {
					// create an empty record for all missing keys
					record[key] = {};
				}
				record = record[key];
			});
			return record;
		}
	}

	/**
	 * Fetches the entity with the given MBID from the internal API ws/js.
	 * @param {MB.MBID} gid MBID of the entity.
	 * @returns {Promise<MB.RE.TargetEntity>}
	 */
	async function fetchEntity(gid) {
		const result = await fetch(`/ws/js/entity/${gid}`);
		return MB.entity(await result.json()); // automatically caches entities
	}

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
	 * Temporary cache for fetched entities from the ws/js API, shared with MBS.
	 */
	const entityCache = new FunctionCache(fetchEntity, {
		keyMapper: (gid) => [gid],
		data: MB.entityCache,
	});

	/**
	 * Dummy function to make the cache fail without actually running an expensive function.
	 * @param {MB.EntityType} entityType
	 * @param {string} name
	 * @returns {string}
	 */
	function _nameToMBID(entityType, name) {
		return undefined;
	}

	const nameToMBIDCache = new FunctionCache(_nameToMBID, {
		keyMapper: (entityType, name) => [entityType, name],
		name: 'nameToMBIDCache',
		storage: window.localStorage
	});

	/** MBS relationship link type IDs (incomplete). */
	const LINK_TYPES = {
		release: {
			label: {
				'©': 708,
				'℗': 711,
				'licensed from': 712,
				'licensed to': 833,
				'distributed by': 361,
				'marketed by': 848
			}
		}
	};

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
	 * Returns the target entity of the given relationship dialog.
	 * @param {MB.RE.Dialog} dialog 
	 */
	function getTargetEntity(dialog) {
		return dialog.relationship().entities() // source and target entity
			.find((entity) => entity.entityType === dialog.targetType());
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

			/**
			 * There are multiple ways to fill the relationship's target entity:
			 * (1) Directly map the name to an MBID (if the name is already cached).
			 * (2) Select the first search result for the name (in automatic mode).
			 * (3) Just fill in the name and let the user select an entity (in manual mode).
			 */
			const targetMBID = await nameToMBIDCache.get(entityType, entry.name); // (1a)
			let targetEntity = targetMBID
				? await entityCache.get(targetMBID) // (1b)
				: MB.entity(automaticMode
					? (await searchEntity(entityType, entry.name))[0] // (2a)
					: { name: entry.name, entityType } // (3a)
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

				if (targetMBID || automaticMode) { // (1c) & (2b)
					dialog.accept();
				} else { // (3b)
					openDialogAndTriggerAutocomplete(dialog);
					await closingDialog(dialog);

					// remember the entity which the user has chosen for the given name
					targetEntity = getTargetEntity(dialog);
					if (targetEntity.gid) {
						nameToMBIDCache.set([entityType, entry.name], targetEntity.gid);
					}
				}
			}
		}
	}

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
	 * Transforms the given value using the given substitution rules.
	 * @param {string} value 
	 * @param {(string|RegExp)[][]} substitutionRules Pairs of values for search & replace.
	 * @returns {string}
	 */
	function transform(value, substitutionRules) {
		substitutionRules.forEach(([searchValue, replaceValue]) => {
			value = value.replace(searchValue, replaceValue);
		});
		return value;
	}

	const labelNamePattern = /(.+?(?:, (?:LLP|Inc\.?))?)(?=,|\.| under |$)/;

	const copyrightPattern = new RegExp(
		/(℗\s*[&+]\s*©|[©℗])\s*(\d+)?\s+/.source + labelNamePattern.source, 'g');

	const legalInfoPattern = new RegExp(
		/(licen[sc]ed? (?:to|from)|(?:distributed|marketed) by)\s+/.source + labelNamePattern.source, 'gi');

	/**
	 * Extracts all copyright data and legal information from the given text.
	 * @param {string} text 
	 */
	function parseCopyrightNotice(text) {
		/** @type {CopyrightData[]} */
		const results = [];

		// standardize copyright notice
		text = transform(text, [
			[/\(C\)/gi, '©'],
			[/\(P\)/gi, '℗'],
			[/«(.+?)»/g, '$1'], // remove a-tisket's French quotes
		]);

		const copyrightMatches = text.matchAll(copyrightPattern);
		for (const match of copyrightMatches) {
			const types = match[1].split(/[&+]/).map(cleanType);
			results.push({
				name: match[3].trim(),
				types,
				year: match[2],
			});
		}

		const legalInfoMatches = text.matchAll(legalInfoPattern);
		for (const match of legalInfoMatches) {
			results.push({
				name: match[2],
				types: [cleanType(match[1])],
			});
		}

		return results;
	}

	/**
	 * Cleans and standardizes the given free text type.
	 * @param {string} type 
	 */
	function cleanType(type) {
		return transform(type.toLowerCase().trim(), [
			[/licen[sc]ed?/g, 'licensed'],
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
	Parse copyright notice
</span>`	;

	function buildUI() {
		$(parseCopyrightButton)
			.on('click', async (event) => {
				const input = prompt('Copyright notice:');
				if (input) {
					const copyrightData = parseCopyrightNotice(input);
					const automaticMode = event.altKey;
					await addCopyrightRelationships(copyrightData, automaticMode);
					addMessageToEditNote(input);
					nameToMBIDCache.store();
				}
			})
			.appendTo('#release-rels');
	}

	nameToMBIDCache.load();
	buildUI();

})();
