// ==UserScript==
// @name         MusicBrainz: Voice actor credits
// @version      2022.7.2
// @namespace    https://github.com/kellnerd/musicbrainz-scripts
// @author       kellnerd
// @description  Simplifies the addition of “spoken vocals” relationships (at release level). Provides additional buttons in the relationship editor to open a pre-filled dialogue or import the credits from Discogs.
// @homepageURL  https://github.com/kellnerd/musicbrainz-scripts#voice-actor-credits
// @downloadURL  https://raw.github.com/kellnerd/musicbrainz-scripts/main/dist/voiceActorCredits.user.js
// @updateURL    https://raw.github.com/kellnerd/musicbrainz-scripts/main/dist/voiceActorCredits.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-scripts/issues
// @grant        GM.getValue
// @grant        GM.setValue
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
		const previousContent = editNoteInput.value.split(editNoteSeparator);
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
			.join(editNoteSeparator);
	}

	const editNoteSeparator = '\n—\n';

	/**
	 * Transforms the given value using the given substitution rules.
	 * @param {string} value
	 * @param {SubstitutionRule[]} substitutionRules Pairs of values for search & replace.
	 * @returns {string}
	 */
	function transform(value, substitutionRules) {
		substitutionRules.forEach(([searchValue, replaceValue]) => {
			value = value.replace(searchValue, replaceValue);
		});
		return value;
	}

	/** @type {CreditParserOptions} */
	const parserDefaults = {
		nameRE: /.+?(?:,?\s(?:LLC|LLP|(?:Corp|Inc|Ltd)\.?|Co\.(?:\sKG)?|(?:\p{Letter}\.){2,}))?/,
		nameSeparatorRE: /[/|](?=\s|\w{2})|\s[–-]\s/,
		terminatorRE: /$|(?=,|(?<!Bros)\.(?:\W|$)|\sunder\s)|(?<=(?<!Bros)\.)\W/,
	};

	/**
	 * Extracts the entity type and ID from a MusicBrainz URL (can be incomplete and/or with additional path components and query parameters).
	 * @param {string} url URL of a MusicBrainz entity page.
	 * @returns {{ type: MB.EntityType | 'mbid', mbid: MB.MBID } | undefined} Type and ID.
	 */
	function extractEntityFromURL$1(url) {
		const entity = url.match(/(area|artist|event|genre|instrument|label|mbid|place|recording|release|release-group|series|url|work)\/([0-9a-f-]{36})(?:$|\/|\?)/);
		return entity ? {
			type: entity[1],
			mbid: entity[2]
		} : undefined;
	}

	/**
	 * @param {MB.EntityType} entityType 
	 * @param {MB.MBID | 'add' | 'create'} mbid MBID of an existing entity or `create` for the entity creation page (`add` for releases).
	 */
	function buildEntityURL$1(entityType, mbid) {
		return `https://musicbrainz.org/${entityType}/${mbid}`;
	}

	/**
	 * Fetches the entity with the given MBID from the internal API ws/js.
	 * @param {MB.MBID} gid MBID of the entity.
	 * @returns {Promise<MB.RE.TargetEntity>}
	 */
	async function fetchEntity$1(gid) {
		const result = await fetch(`/ws/js/entity/${gid}`);
		return MB.entity(await result.json()); // automatically caches entities
	}

	/**
	 * Returns a promise that resolves after the given delay.
	 * @param {number} ms Delay in milliseconds.
	 */
	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Periodically calls the given function until it returns `true` and resolves afterwards.
	 * @param {(...params) => boolean} pollingFunction
	 * @param {number} pollingInterval
	 */
	function waitFor(pollingFunction, pollingInterval) {
		return new Promise(async (resolve) => {
			while (pollingFunction() === false) {
				await delay(pollingInterval);
			}
			resolve();
		});
	}

	/**
	 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
	 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
	 * @param {Partial<MB.InternalArtist>} [artistData] Data of the performing artist (optional).
	 * @param {string} [roleName] Credited name of the voice actor's role (optional).
	 * @param {string} [artistCredit] Credited name of the performing artist (optional).
	 */
	function createVoiceActorDialog(artistData = {}, roleName = '', artistCredit = '') {
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

	/** Resolves after the release relationship editor has finished loading. */
	function releaseLoadingFinished() {
		return waitFor(() => !MB.releaseRelationshipEditor.loadingRelease(), 100);
	}

	// adapted from https://stackoverflow.com/a/25621277

	/**
	 * Resizes the bound element to be as tall as necessary for its content.
	 * @this {HTMLElement}
	 */
	function automaticHeight() {
		this.style.height = 'auto';
		this.style.height = this.scrollHeight + 'px';
	}

	/**
	 * Resizes the bound element to be as wide as necessary for its content.
	 * @this {HTMLElement} this 
	 */
	function automaticWidth() {
		this.style.width = 'auto';
		this.style.width = this.scrollWidth + 10 + 'px'; // account for border and padding
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

	/** Pattern to match an ES RegExp string representation. */
	const regexPattern = /^\/(.+?)\/([gimsuy]*)$/;

	/**
	 * Escapes special characters in the given string to use it as part of a regular expression.
	 * @param {string} string 
	 * @link https://stackoverflow.com/a/6969486
	 */
	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	/**
	 * Returns the value of the given pattern as a regular expression if it is enclosed between slashes.
	 * Otherwise it returns the input string or throws for invalid regular expressions.
	 * @param {string} pattern 
	 * @returns {RegExp|string}
	 */
	function getPattern(pattern) {
		const match = pattern.match(regexPattern);
		if (match) {
			return new RegExp(match[1], match[2]);
		} else {
			return pattern;
		}
	}

	/**
	 * Converts the value of the given pattern into a regular expression and returns it.
	 * @param {string} pattern 
	 */
	function getPatternAsRegExp(pattern) {
		try {
			let value = getPattern(pattern);
			if (typeof value === 'string') {
				value = new RegExp(escapeRegExp(value));
			}
			return value;
		} catch {
			return;
		}
	}

	/**
	 * Converts a string into an identifier that is compatible with Markdown's heading anchors.
	 * @param {string} string
	 */
	function slugify(string) {
		return encodeURIComponent(
			string.trim()
				.toLowerCase()
				.replace(/\s+/g, '-')
		);
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
	 * @param {HTMLInputElement} element 
	 * @param {string} [defaultValue]
	 * @returns {Promise<HTMLInputElement>}
	 */
	function persistInput(element, defaultValue) {
		return persistElement(element, 'value', 'change', defaultValue);
	}

	const creditParserUI =
`<details id="credit-parser">
<summary>
	<h2>Credit Parser</h2>
</summary>
<form>
	<div class="row">
		<textarea name="credit-input" id="credit-input" cols="120" rows="1" placeholder="Paste credits here…"></textarea>
	</div>
	<div class="row">
		Identified relationships will be added to the release and/or the matching recordings and works (only if these are selected).
	</div>
	<div class="row" id="credit-patterns">
	</div>
	<div class="row">
		<input type="checkbox" name="remove-parsed-lines" id="remove-parsed-lines" />
		<label class="inline" for="remove-parsed-lines">Remove parsed lines</label>
		<input type="checkbox" name="parser-autofocus" id="parser-autofocus" />
		<label class="inline" for="parser-autofocus">Autofocus the parser on page load</label>
	</div>
	<div class="row buttons">
	</div>
</form>
</details>`	;

	const css =
`details#credit-parser > summary {
	cursor: pointer;
	display: block;
}
details#credit-parser > summary > h2 {
	display: list-item;
}
textarea#credit-input {
	overflow-y: hidden;
}
form div.row span.col:not(:last-child)::after {
	content: " | ";
}
form div.row span.col label {
	margin-right: 0;
}
#credit-parser label[title] {
	border-bottom: 1px dotted;
	cursor: help;
}`	;

	const uiReadyEventType = 'credit-parser-ui-ready';

	/**
	 * Injects the basic UI of the credit parser and waits until the UI has been expanded before it continues with the build tasks.
	 * @param {...(() => void)} buildTasks Handlers which can be registered for additional UI build tasks.
	 */
	function buildCreditParserUI(...buildTasks) {
		/** @type {HTMLDetailsElement} */
		const existingUI = dom('credit-parser');

		// possibly called by multiple userscripts, do not inject the UI again
		if (!existingUI) {
			// inject credit parser between the sections for track and release relationships,
			// use the "Release Relationships" heading as orientation since #tracklist is missing for releases without mediums
			qs('#content > h2:nth-of-type(2)').insertAdjacentHTML('beforebegin', creditParserUI);
			injectStylesheet(css, 'credit-parser');
		}

		// execute all additional build tasks once the UI is open and ready
		if (existingUI && existingUI.open) {
			// our custom event already happened because the UI builder code is synchronous
			buildTasks.forEach((task) => task());
		} else {
			// wait for our custom event if the UI is not (fully) initialized or is collapsed
			buildTasks.forEach((task) => document.addEventListener(uiReadyEventType, () => task(), { once: true }));
		}

		if (existingUI) return;

		// continue initialization of the UI once it has been opened
		persistDetails('credit-parser', true).then((UI) => {
			if (UI.open) {
				initializeUI();
			} else {
				UI.addEventListener('toggle', function toggleHandler(event) {
					UI.removeEventListener(event.type, toggleHandler);
					initializeUI();
				});
			}
		});
	}

	function initializeUI() {
		const creditInput = dom('credit-input');

		// persist the state of the UI
		persistCheckbox('remove-parsed-lines');
		persistCheckbox('parser-autofocus');

		// auto-resize the credit textarea on input
		creditInput.addEventListener('input', automaticHeight);

		addButton('Load annotation', (creditInput) => {
			const annotation = MB.releaseRelationshipEditor.source.latest_annotation;
			if (annotation) {
				creditInput.value = annotation.text;
				creditInput.dispatchEvent(new Event('input'));
			}
		});

		addPatternInput({
			label: 'Credit terminator',
			description: 'Matches the end of a credit (default when empty: end of line)',
			defaultValue: parserDefaults.terminatorRE,
		});

		addPatternInput({
			label: 'Name separator',
			description: 'Splits the extracted name into multiple names (disabled by default when empty)',
			defaultValue: parserDefaults.nameSeparatorRE,
		});

		// trigger all additional UI build tasks
		document.dispatchEvent(new CustomEvent(uiReadyEventType));

		// focus the credit parser input once all relationships have been loaded (and displayed)
		releaseLoadingFinished().then(() => {
			if (dom('parser-autofocus').checked) {
				creditInput.scrollIntoView();
				creditInput.focus();
			}
		});
	}

	/**
	 * Adds a new button with the given label and click handler to the credit parser UI.
	 * @param {string} label 
	 * @param {(creditInput: HTMLTextAreaElement, event: MouseEvent) => any} clickHandler 
	 * @param {string} [description] Description of the button, shown as tooltip.
	 */
	function addButton(label, clickHandler, description) {
		/** @type {HTMLTextAreaElement} */
		const creditInput = dom('credit-input');

		/** @type {HTMLButtonElement} */
		const button = createElement(`<button type="button">${label}</button>`);
		if (description) {
			button.title = description;
		}

		button.addEventListener('click', (event) => clickHandler(creditInput, event));

		return qs('#credit-parser .buttons').appendChild(button);
	}

	/**
	 * Adds a new parser button with the given label and handler to the credit parser UI.
	 * @param {string} label 
	 * @param {(creditLine: string, event: MouseEvent) => MaybePromise<CreditParserLineStatus>} parser
	 * Handler which parses the given credit line and returns whether it was successful.
	 * @param {string} [description] Description of the button, shown as tooltip.
	 */
	function addParserButton(label, parser, description) {
		/** @type {HTMLInputElement} */
		const removeParsedLines = dom('remove-parsed-lines');

		return addButton(label, async (creditInput, event) => {
			const credits = creditInput.value.split('\n').map((line) => line.trim());
			const parsedLines = [], skippedLines = [];

			for (const line of credits) {
				// skip empty lines, but keep them for display of skipped lines
				if (!line) {
					skippedLines.push(line);
					continue;
				}

				// treat partially parsed lines as both skipped and parsed
				const parserStatus = await parser(line, event);
				if (parserStatus !== 'skipped') {
					parsedLines.push(line);
				}
				if (parserStatus !== 'done') {
					skippedLines.push(line);
				}
			}

			if (parsedLines.length) {
				addMessageToEditNote(parsedLines.join('\n'));
			}

			if (removeParsedLines.checked) {
				creditInput.value = skippedLines.join('\n');
				creditInput.dispatchEvent(new Event('input'));
			}
		}, description);
	}

	/**
	 * Adds a persisted input field for regular expressions with a validation handler to the credit parser UI.
	 * @param {object} config
	 * @param {string} [config.id] ID and name of the input element (derived from `label` if missing).
	 * @param {string} config.label Content of the label (without punctuation).
	 * @param {string} config.description Description which should be used as tooltip.
	 * @param {string} config.defaultValue Default value of the input.
	 */
	function addPatternInput(config) {
		const id = config.id || slugify(config.label);
		/** @type {HTMLInputElement} */
		const patternInput = createElement(`<input type="text" class="pattern" name="${id}" id="${id}" placeholder="String or /RegExp/" />`);

		const explanationLink = document.createElement('a');
		explanationLink.innerText = 'help';
		explanationLink.target = '_blank';
		explanationLink.title = 'Displays a diagram representation of this RegExp';

		const resetButton = createElement(`<button type="button" title="Reset the input to its default value">Reset</button>`);
		resetButton.addEventListener('click', () => setInput(patternInput, config.defaultValue));

		// auto-resize the pattern input on input
		patternInput.addEventListener('input', automaticWidth);

		// validate pattern and update explanation link on change
		patternInput.addEventListener('change', function () {
			explanationLink.href = 'https://kellnerd.github.io/regexper/#' + encodeURIComponent(getPatternAsRegExp(this.value) ?? this.value);
			this.classList.remove('error', 'success');
			this.title = '';

			try {
				if (getPattern(this.value) instanceof RegExp) {
					this.classList.add('success');
					this.title = 'Valid regular expression';
				}
			} catch (error) {
				this.classList.add('error');
				this.title = `Invalid regular expression: ${error.message}\nThe default value will be used.`;
			}
		});

		// inject label, input, reset button and explanation link
		const span = document.createElement('span');
		span.className = 'col';
		span.insertAdjacentHTML('beforeend', `<label class="inline" for="${id}" title="${config.description}">${config.label}:</label>`);
		span.append(' ', patternInput, ' ', resetButton, ' ', explanationLink);
		dom('credit-patterns').appendChild(span);

		// persist the input and calls the setter for the initial value (persisted value or the default)
		persistInput(patternInput, config.defaultValue).then(setInput);

		return patternInput;
	}

	/**
	 * Sets the input to the given value (optional), resizes it and triggers persister and validation.
	 * @param {HTMLInputElement} input 
	 * @param {string} [value] 
	 */
	function setInput(input, value) {
		if (value) input.value = value;
		automaticWidth.call(input);
		input.dispatchEvent(new Event('change'));
	}

	/**
	 * @template Params
	 * @template Result
	 */
	class FunctionCache {
		/**
		 * @param {(...params: Params) => Result | Promise<Result>} expensiveFunction Expensive function whose results should be cached.
		 * @param {Object} options
		 * @param {(...params: Params) => Key[]} options.keyMapper Maps the function parameters to the components of the cache's key.
		 * @param {string} [options.name] Name of the cache, used as storage key (optional).
		 * @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
		 * @param {Record<Key, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
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
		 * @param {Key[]} keys Components of the key.
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
		 * @param {Key[]} keys Components of the key.
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
	 * @template Params
	 * @template Result
	 * @extends {FunctionCache<Params,Result>}
	 */
	class SimpleCache extends FunctionCache {
		/**
		* @param {Object} options
		* @param {string} [options.name] Name of the cache, used as storage key (optional).
		* @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
		* @param {Record<Key, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
		*/
		constructor(options) {
			// use a dummy function to make the function cache fail without actually running an expensive function
			super((...params) => undefined, {
				...options,
				keyMapper: (...params) => params,
			});
		}
	}

	/** @type {SimpleCache<[entityType: MB.EntityType, name: string], MB.MBID>} */
	const nameToMBIDCache = new SimpleCache({
		name: 'nameToMBIDCache',
		storage: window.localStorage,
	});

	/**
	 * Extracts the entity type and ID from a Discogs URL.
	 * @param {string} url URL of a Discogs entity page.
	 * @returns {[Discogs.EntityType,string]|undefined} Type and ID.
	 */
	function extractEntityFromURL(url) {
		return url.match(/(artist|label|master|release)\/(\d+)/)?.slice(1);
	}

	/**
	 * @param {Discogs.EntityType} entityType
	 * @param {number} entityId
	 */
	function buildEntityURL(entityType, entityId) {
		return `https://www.discogs.com/${entityType}/${entityId}`;
	}

	/**
	 * @param {Discogs.EntityType} entityType
	 * @param {number} entityId
	 */
	function buildApiURL(entityType, entityId) {
		return `https://api.discogs.com/${entityType}s/${entityId}`;
	}

	// Adapted from https://thoughtspile.github.io/2018/07/07/rate-limit-promises/

	function rateLimit1(operation, interval) {
		let queue = Promise.resolve(); // empty queue is ready
		return (...args) => {
			const result = queue.then(() => operation(...args)); // queue the next operation
			queue = queue.then(() => delay(interval)); // start the next delay
			return result;
		};
	}

	/**
	 * Limits the number of requests for the given operation within a time interval.
	 * @template Params
	 * @template Result
	 * @param {(...args:Params)=>Result} operation Operation that should be rate-limited.
	 * @param {number} interval Time interval (in ms).
	 * @param {number} requestsPerInterval Maximum number of requests within the interval.
	 * @returns {(...args:Params)=>Promise<Result>} Rate-limited version of the given operation.
	 */
	function rateLimit(operation, interval, requestsPerInterval = 1) {
		if (requestsPerInterval == 1) {
			return rateLimit1(operation, interval);
		}
		const queues = Array(requestsPerInterval).fill().map(() => rateLimit1(operation, interval));
		let queueIndex = 0;
		return (...args) => {
			queueIndex = (queueIndex + 1) % requestsPerInterval; // use the next queue
			return queues[queueIndex](...args); // return the rate-limited operation
		};
	}

	/**
	 * Calls to the MusicBrainz API are limited to one request per second.
	 * https://musicbrainz.org/doc/MusicBrainz_API
	 */
	const callAPI$1 = rateLimit(fetch, 1000);

	/**
	 * Requests the given entity from the MusicBrainz API.
	 * @param {string} url (Partial) URL which contains the entity type and the entity's MBID.
	 * @param {string[]} inc Include parameters which should be added to the API request.
	 * @returns {Promise<MB.Entity>}
	 */
	function fetchEntity(url, inc) {
		const entity = extractEntityFromURL$1(url);
		if (!entity) throw new Error('Invalid entity URL');

		const endpoint = [entity.type, entity.mbid].join('/');
		return fetchFromAPI(endpoint, {}, inc);
	}

	/**
	 * Returns the entity of the desired type which is associated to the given resource URL.
	 * @param {MB.EntityType} entityType Desired type of the entity.
	 * @param {string} resourceURL 
	 * @returns {Promise<MB.Entity>} The first matching entity. (TODO: handle ambiguous URLs)
	 */
	async function getEntityForResourceURL(entityType, resourceURL) {
		try {
			const url = await fetchFromAPI('url', { resource: resourceURL }, [`${entityType}-rels`]);
			return url?.relations.filter((rel) => rel['target-type'] === entityType)?.[0][entityType];
		} catch (error) {
			return null;
		}
	}

	/**
	 * Makes a request to the MusicBrainz API of the currently used server and returns the results as JSON.
	 * @param {string} endpoint Endpoint (e.g. the entity type) which should be queried.
	 * @param {Record<string,string>} query Query parameters.
	 * @param {string[]} inc Include parameters which should be added to the query parameters.
	 */
	async function fetchFromAPI(endpoint, query = {}, inc = []) {
		if (inc.length) {
			query.inc = inc.join(' '); // spaces will be encoded as `+`
		}
		query.fmt = 'json';
		const headers = {
			'Accept': 'application/json',
			// 'User-Agent': 'Application name/<version> ( contact-url )',
		};
		const response = await callAPI$1(`https://musicbrainz.org/ws/2/${endpoint}?${new URLSearchParams(query)}`, { headers });
		if (response.ok) {
			return response.json();
		} else {
			throw response;
		}
	}

	const DISCOGS_ENTITY_TYPES = {
		artist: 'artist',
		label: 'label',
		release: 'release',
		'release_group': 'master',
	};

	/**
	 * Maps Discogs IDs to MBIDs.
	 * @param {MB.EntityType} entityType 
	 * @param {number} discogsId 
	 */
	async function discogsToMBID(entityType, discogsId) {
		const discogsType = DISCOGS_ENTITY_TYPES[entityType];
		if (!discogsType) return;

		const entity = await getEntityForResourceURL(entityType, buildEntityURL(discogsType, discogsId));
		return entity?.id;
	}

	/**
	 * Cache for the mapping of Discogs entities to the MBIDs of their equivalent entities on MusicBrainz.
	 */
	const discogsToMBIDCache = new FunctionCache(discogsToMBID, {
		keyMapper: (type, id) => [type, id],
		name: 'discogsToMBIDCache',
		storage: window.localStorage,
	});

	/**
	 * Creates an URL to seed the editor of the given entity with the given external link.
	 * @param {MB.EntityType} type Type of the target entity.
	 * @param {MB.MBID} mbid MBID of the target entity.
	 * @param {string} url External link.
	 * @param {number} linkTypeID
	 * @param {string} [editNote]
	 */
	function seedURLForEntity(type, mbid, url, linkTypeID, editNote) {
		const seedingParams = new URLSearchParams({
			[`edit-${type}.url.0.text`]: url,
			[`edit-${type}.url.0.link_type_id`]: linkTypeID,
		});

		if (editNote) {
			seedingParams.set(`edit-${type}.edit_note`, buildEditNote(editNote));
		}

		return `${buildEntityURL$1(type, mbid)}/edit?${seedingParams}`;
	}

	/**
	 * Temporary cache for fetched entities from the ws/js API, shared with MBS.
	 */
	const entityCache = new FunctionCache(fetchEntity$1, {
		keyMapper: (gid) => [gid],
		data: MB.entityCache,
	});

	/**
	 * Default punctuation rules.
	 * @type {SubstitutionRule[]}
	 */
	const punctuationRules = [
		/* quoted text */
		[/(?<=[^\p{L}\d]|^)"(.+?)"(?=[^\p{L}\d]|$)/ug, '“$1”'], // double quoted text
		[/(?<=\W|^)'(n)'(?=\W|$)/ig, '’$1’'], // special case: 'n'
		[/(?<=[^\p{L}\d]|^)'(.+?)'(?=[^\p{L}\d]|$)/ug, '‘$1’'], // single quoted text
		// ... which is enclosed by non-word characters or at the beginning/end of the title
		// [^\p{L}\d] matches Unicode characters which are neither letters nor digits (\W only works with Latin letters)

		/* primes */
		[/(\d+)"/g, '$1″'], // double primes, e.g. for 12″
		[/(\d+)'(\d+)/g, '$1′$2'], // single primes, e.g. for 3′42″ but not for 70’s

		/* apostrophes */
		[/'/g, '’'], // ... and finally the apostrophes should be remaining

		/* ellipses */
		[/(?<!\.)\.{3}(?!\.)/g, '…'], // horizontal ellipsis (but not more than three dots)

		/* dashes */
		[/ - /g, ' – '], // en dash as separator

		/* hyphens for (partial) ISO 8601 dates, e.g. 1987‐07–30 or 2016-04 */
		[/\d{4}-\d{2}(?:-\d{2})?(?=\W|$)/g, (potentialDate) => {
			if (Number.isNaN(Date.parse(potentialDate))) return potentialDate; // skip invalid date strings, e.g. 1989-90
			return potentialDate.replaceAll('-', '‐');
		}],

		/* figure dashes: separate three or more groups of digits (two groups could be range) */
		[/\d+(-\d+){2,}/g, (groupedDigits) => groupedDigits.replaceAll('-', '‒')],

		[/(\d+)-(\d+)/g, '$1–$2'], // en dash for ranges where it means "to", e.g. 1965–1972

		/* hyphens */
		[/(?<=\S)-(?=\S)/g, '‐'], // ... and finally the hyphens should be remaining

		/* rare cases where it is difficult to define precise rules: em dash, minus */
	];

	/**
	 * Language-specific double and single quotes (RegEx replace values).
	 * @type {Record<string, string[]>}
	 */
	const languageSpecificQuotes = {
		English: ['“$1”', '‘$1’'],
		French: ['« $1 »', '‹ $1 ›'],
		German: ['„$1“', '‚$1‘'],
	};

	/**
	 * Indices of the quotation rules (double and single quotes) in `punctuationRules`.
	 */
	const quotationRuleIndices = [0, 2];

	/**
	 * Additional punctuation rules for certain languages, will be appended to the default rules.
	 * @type {Record<string, SubstitutionRule[]>}
	 */
	const languageSpecificRules = {
		German: [
			[/(\w+)-(\s)|(\s)-(\w+)/g, '$1$3‐$2$4'], // hyphens for abbreviated compound words
		],
		Japanese: [
			[/(?<=[^\p{L}\d]|^)-(.+?)-(?=[^\p{L}\d]|$)/ug, '–$1–'], // dashes used as brackets
		],
	};

	/**
	 * Creates language-specific punctuation guessing substitution rules.
	 * @param {string} [language] Name of the language (in English).
	 */
	function punctuationRulesForLanguage(language) {
		// create a deep copy to prevent modifications of the default rules
		let rules = [...punctuationRules]; 

		// overwrite replace values for quotation rules with language-specific values (if they are existing)
		const replaceValueIndex = 1;
		languageSpecificQuotes[language]?.forEach((value, index) => {
			const ruleIndex = quotationRuleIndices[index];
			rules[ruleIndex][replaceValueIndex] = value;
		});

		// append language-specific rules (if they are existing)
		languageSpecificRules[language]?.forEach((rule) => {
				rules.push(rule);
		});

		return rules;
	}

	/**
	 * Searches and replaces ASCII punctuation symbols of the given text by their preferred Unicode counterparts.
	 * These can only be guessed based on context as the ASCII symbols are ambiguous.
	 * @param {string} text
	 * @param {string} [language] Language of the text (English name, optional).
	 */
	function guessUnicodePunctuation(text, language) {
		return transform(text, punctuationRulesForLanguage(language));
	}

	/**
	 * Calls to the Discogs API are limited to 25 unauthenticated requests per minute.
	 * https://www.discogs.com/developers/
	 */
	const callAPI = rateLimit(fetch, 60 * 1000, 25);

	/**
	 * Requests the given entity from the Discogs API.
	 * @param {Discogs.EntityType} entityType 
	 * @param {number} entityId 
	 */
	async function fetchEntityFromAPI(entityType, entityId) {
		const response = await callAPI(buildApiURL(entityType, entityId));
		if (response.ok) {
			return response.json();
		} else {
			throw response;
		}
	}

	/**
	 * Fetches the extra artists (credits) for the given release.
	 * @param {string} releaseURL URL of a Discogs release page.
	 */
	async function fetchCredits(releaseURL) {
		const entity = extractEntityFromURL(releaseURL);
		if (entity && entity[0] === 'release') {
			/** @type {Discogs.Release} */
			const release = await fetchEntityFromAPI(...entity);
			return release.extraartists.flatMap((artist) => {
				// drop bracketed numeric suffixes for ambiguous artist names
				artist.name = artist.name.replace(/ \(\d+\)$/, '');

				artist.anv = guessUnicodePunctuation(artist.anv || artist.name);

				// split multiple roles into multiple credits (separated by commas which are not inside square brackets)
				return artist.role.split(/,\s*(?![^[\]]*\])/).map((role) => {
					/** @type {Discogs.ParsedArtist} */
					const parsedArtist = { ...artist };

					// use a separate attribute for credited role names in square brackets
					const roleWithCredit = role.match(/(.+?) \[(.+)\]$/);
					if (roleWithCredit) {
						parsedArtist.role = roleWithCredit[1];
						parsedArtist.roleCredit = guessUnicodePunctuation(roleWithCredit[2]);
					} else {
						parsedArtist.role = role;
					}

					return parsedArtist;
				});
			});
		} else {
			throw new Error('Invalid Discogs URL');
		}
	}

	/**
	 * Fetches the voice actor and narrator credits for the given release.
	 * @param {string} releaseURL URL of a Discogs release page.
	 */
	async function fetchVoiceActors(releaseURL) {
		return (await fetchCredits(releaseURL))
			.filter((artist) => ['Voice Actor', 'Narrator'].includes(artist.role))
			.flatMap((artist) => {
				// split artists with multiple roles into multiple credits
				const roles = artist.roleCredit?.split('/');
				if (!roles || roles.length === 1) return artist;
				return roles.map((role) => ({ ...artist, roleCredit: role.trim() }));
			});
	}

	/**
	 * Adds a voice actor release relationship for the given artist and their role.
	 * Automatically maps artist names to MBIDs where possible, asks the user to match the remaining ones.
	 * @param {string} artistName Artist name (as credited).
	 * @param {string} roleName Credited role of the artist.
	 * @returns {Promise<CreditParserLineStatus>}
	 */
	async function addVoiceActorRelationship(artistName, roleName) {
		const artistMBID = await nameToMBIDCache.get('artist', artistName);

		if (artistMBID) {
			// mapping already exists, automatically add the relationship
			const mbArtist = await entityCache.get(artistMBID);
			createVoiceActorDialog(mbArtist, roleName, artistName).accept();
			return 'done';
		} else {
			// pre-fill dialog and collect mappings for freshly matched artists
			const artistMatch = await letUserSelectVoiceActor(artistName, roleName, artistName);
			if (artistMatch.gid) {
				nameToMBIDCache.set(['artist', artistName], artistMatch.gid);
				return 'done';
			} else {
				return 'skipped';
			}
		}
	}

	/**
	 * Imports all existing voice actor credits from the given Discogs release.
	 * Automatically maps Discogs entities to MBIDs where possible, asks the user to match the remaining ones.
	 * @param {string} releaseURL URL of the Discogs source release.
	 * @returns - Number of credits (total & automatically mapped).
	 * - List of unmapped entities (manually matched or skipped) for which MB does not store the Discogs URLs.
	 */
	async function importVoiceActorsFromDiscogs(releaseURL) {
		/**
		 * Unmapped entities for which MB does not store the Discogs URLs.
		 * @type {EntityMapping[]}
		 */
		const unmappedArtists = [];
		let mappedCredits = 0;

		const actors = await fetchVoiceActors(releaseURL);
		for (const actor of actors) {
			let roleName = actor.roleCredit;

			// always give Discogs narrators a role name,
			// otherwise both "Narrator" and "Voice Actors" roles are mapped to MB's "spoken vocals" rels without distinction
			if (!roleName && actor.role === 'Narrator') {
				roleName = 'Narrator'; // TODO: localize according to release language?
			}

			const artistCredit = actor.anv; // we are already using the name as a fallback
			const artistMBID = await discogsToMBIDCache.get('artist', actor.id);

			if (artistMBID) {
				// mapping already exists, automatically add the relationship
				const mbArtist = await entityCache.get(artistMBID);
				createVoiceActorDialog(mbArtist, roleName, artistCredit).accept();
				mappedCredits++;
				// duplicates of already existing rels will be merged automatically
			} else {
				// pre-fill dialog and collect mappings for freshly matched artists
				const artistMatch = await letUserSelectVoiceActor(actor.name, roleName, artistCredit);
				if (artistMatch.gid) {
					discogsToMBIDCache.set(['artist', actor.id], artistMatch.gid);
				}
				unmappedArtists.push({
					MBID: artistMatch.gid,
					name: artistMatch.name,
					comment: artistMatch.comment,
					externalURL: buildEntityURL('artist', actor.id),
					externalName: actor.name,
				});
			}
		}

		// persist cache entries after each import, TODO: only do this on page unload
		discogsToMBIDCache.store();

		return {
			totalCredits: actors.length,
			mappedCredits,
			unmappedArtists,
		};
	}

	async function letUserSelectVoiceActor(artistName, roleName, artistCredit) {
		const dialog = createVoiceActorDialog({ name: artistName }, roleName, artistCredit);

		// let the user select the matching entity
		openDialogAndTriggerAutocomplete(dialog);
		await closingDialog(dialog);

		return getTargetEntity(dialog);
	}

	const UI =
`<div id="credit-import-tools">
	<div id="credit-import-status" class="row no-label"></div>
	<div id="credit-import-errors" class="row no-label error"></div>
</div>`	;

	// TODO: only show button for certain RG types (audiobook, audio drama, spoken word) of the MB release?
	function injectAddVoiceActorButton() {
		const addIcon = qs('span.add-rel.btn > img')?.src;
		const addVoiceActorButton = createElement(`
	<span class="add-rel btn" id="add-voice-actor-credit">
		<img class="bottom" src="${addIcon}">Add voice actor relationship
	</span>`);

		addVoiceActorButton.addEventListener('click', (event) => createVoiceActorDialog().open(event));
		dom('release-rels').appendChild(addVoiceActorButton);
	}

	function buildVoiceActorCreditParserUI() {
		nameToMBIDCache.load();

		addParserButton('Parse voice actor credits', async (creditLine, event) => {
			const voiceActorCredit = creditLine.match(/^(.+)(?:\s[–-]\s|\t+)(.+)$/);

			if (voiceActorCredit) {
				const names = voiceActorCredit.slice(1).map((name) => name.trim());
				const swapNames = event.shiftKey;

				// assume that role names are credited before the artist name, so we have to swap by default
				if (!swapNames) names.reverse();

				const result = await addVoiceActorRelationship(...names);
				nameToMBIDCache.store();
				return result;
			} else {
				return 'skipped';
			}
		}, [
			'SHIFT key to swap the order of artist names and their role names',
		].join('\n'));
	}

	function buildVoiceActorCreditImporterUI() {
		discogsToMBIDCache.load();

		dom('credit-parser').insertAdjacentHTML('beforeend', UI);

		addButton('Import voice actors', async () => {
			const releaseData = await fetchEntity(window.location.href, ['release-groups', 'url-rels']);
			const releaseURL = buildEntityURL$1('release', releaseData.id);
			let discogsURL = releaseData.relations.find((rel) => rel.type === 'discogs')?.url.resource;

			if (!discogsURL) {
				discogsURL = prompt('Discogs release URL');
			}

			if (discogsURL) {
				const result = await importVoiceActorsFromDiscogs(discogsURL);
				addMessageToEditNote(`Imported voice actor credits from ${discogsURL}`);

				// mapping suggestions
				const newMatches = result.unmappedArtists.filter((mapping) => mapping.MBID);
				const artistSeedNote = `Matching artist identified while importing credits from ${discogsURL} to ${releaseURL}`;
				const messages = newMatches.map((match) => [
					'Please add the external link',
					`<a href="${match.externalURL}" target="_blank">${match.externalName}</a>`,
					'to the matched entity:',
					`<a href="${seedURLForEntity('artist', match.MBID, match.externalURL, 180, artistSeedNote)}" target="_blank">${match.name}</a>`,
					match.comment ? `<span class="comment">(<bdi>${match.comment}</bdi>)</span>` : '',
				].join(' '));

				// import statistics
				const importedCredits = result.mappedCredits + newMatches.length;
				messages.unshift(`Successfully imported ${importedCredits} of ${result.totalCredits} credits, ${result.mappedCredits} of them were mapped automatically.`);

				dom('credit-import-status').innerHTML = messages.map((message) => `<p>${message}</p>`).join('\n');
			}
		}, 'Import credits from Discogs');
	}

	injectAddVoiceActorButton();
	buildCreditParserUI(buildVoiceActorCreditParserUI, buildVoiceActorCreditImporterUI);

})();
