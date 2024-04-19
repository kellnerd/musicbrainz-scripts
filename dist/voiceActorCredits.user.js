// ==UserScript==
// @name          MusicBrainz: Voice actor credits
// @version       2024.4.19
// @namespace     https://github.com/kellnerd/musicbrainz-scripts
// @author        kellnerd
// @description   Parses voice actor credits from text and automates the process of creating release or recording relationships for these. Also imports credits from Discogs.
// @homepageURL   https://github.com/kellnerd/musicbrainz-scripts#voice-actor-credits
// @downloadURL   https://raw.github.com/kellnerd/musicbrainz-scripts/main/dist/voiceActorCredits.user.js
// @updateURL     https://raw.github.com/kellnerd/musicbrainz-scripts/main/dist/voiceActorCredits.user.js
// @supportURL    https://github.com/kellnerd/musicbrainz-scripts/issues
// @grant         GM.getValue
// @grant         GM.setValue
// @run-at        document-idle
// @match         *://*.musicbrainz.org/release/*/edit-relationships
// ==/UserScript==

(function () {
	'use strict';

	// Adapted from https://stackoverflow.com/a/46012210

	Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

	const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;

	/**
	 * Sets the value of a textarea input element which has been manipulated by React.
	 * @param {HTMLTextAreaElement} input 
	 * @param {string} value 
	 */
	function setReactTextareaValue(input, value) {
		nativeTextareaValueSetter.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
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
	 * Adds the given message and a footer for the active userscript to the edit note.
	 * @param {string} message Edit note message.
	 */
	function addMessageToEditNote(message) {
		/** @type {HTMLTextAreaElement} */
		const editNoteInput = qs('#edit-note-text, .edit-note');
		const previousContent = editNoteInput.value.split(editNoteSeparator);
		setReactTextareaValue(editNoteInput, buildEditNote(...previousContent, message));
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
	 * @param {import('../types').SubstitutionRule[]} substitutionRules Pairs of values for search & replace.
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
		nameRE: /.+?(?:,?\s(?:LLC|LLP|(?:Corp|Inc|Ltd)\.?|Co\.(?:\sKG)?|(?:\p{Letter}\.){2,}))*/,
		nameSeparatorRE: /[/|](?=\s|\w{2})|\s[–-]\s/,
		terminatorRE: /$|(?=,|(?<!Bros)\.(?:\W|$)|\sunder\s)|(?<=(?<!Bros)\.)\W/,
	};

	/**
	 * Returns a promise that resolves after the given delay.
	 * @param {number} ms Delay in milliseconds.
	 */
	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Retries the given operation until the result is no longer undefined.
	 * @template T
	 * @param {() => T | Promise<T>} operation 
	 * @param {Object} [options]
	 * @param {number} [options.retries] Maximum number of retries.
	 * @param {number} [options.wait] Number of ms to wait before the next try, disabled by default.
	 * @returns The final result of the operation.
	 */
	async function retry(operation, { retries = 10, wait = 0 } = {}) {
		do {
			const result = await operation();
			if (result !== undefined) return result;
			if (wait) await delay(wait);
		} while (retries--)
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

	/** Resolves as soon as the React relationship editor is ready. */
	function readyRelationshipEditor() {
		const reactRelEditor = qs('.release-relationship-editor');
		if (!reactRelEditor) return Promise.reject(new Error('Release relationship editor has not been found'));
		// wait for the loading message to disappear (takes ~1s)
		return waitFor(() => !qs('.release-relationship-editor > .loading-message'), 100);
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
	 * @returns {RegExp | string}
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
	 * @param {string | number | boolean} [defaultValue] Default value of the attribute.
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
	 * @param {HTMLInputElement | HTMLTextAreaElement} element 
	 * @param {string} [defaultValue]
	 * @returns {Promise<HTMLInputElement>}
	 */
	function persistInput(element, defaultValue) {
		return persistElement(element, 'value', 'change', defaultValue);
	}

	const creditParserUI = `
<details id="credit-parser">
<summary>
	<h2>Credit Parser</h2>
</summary>
<form>
	<details id="credit-parser-config">
		<summary><h3>Advanced configuration</h3></summary>
		<ul id="credit-patterns"></ul>
	</details>
	<div class="row">
		<textarea name="credit-input" id="credit-input" cols="120" rows="1" placeholder="Paste credits here…"></textarea>
	</div>
	<div class="row">
		Identified relationships will be added to the release and/or the matching recordings and works (only if these are selected).
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
</details>`;

	const css = `
details#credit-parser summary {
	cursor: pointer;
	display: block;
}
details#credit-parser summary > h2, details#credit-parser summary > h3 {
	display: list-item;
}
textarea#credit-input {
	overflow-y: hidden;
}
#credit-parser label[title] {
	border-bottom: 1px dotted;
	cursor: help;
}`;

	const uiReadyEventType = 'credit-parser-ui-ready';

	/**
	 * Injects the basic UI of the credit parser and waits until the UI has been expanded before it continues with the build tasks.
	 * @param {...(() => void)} buildTasks Handlers which can be registered for additional UI build tasks.
	 */
	async function buildCreditParserUI(...buildTasks) {
		await readyRelationshipEditor();

		/** @type {HTMLDetailsElement} */
		const existingUI = dom('credit-parser');

		// possibly called by multiple userscripts, do not inject the UI again
		if (!existingUI) {
			// inject credit parser between the sections for track and release relationships,
			// use the "Release Relationships" heading as orientation since #tracklist is missing for releases without mediums
			qs('.release-relationship-editor > h2:nth-of-type(2)').insertAdjacentHTML('beforebegin', creditParserUI);
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
				UI.addEventListener('toggle', initializeUI, { once: true });
			}
		});
	}

	async function initializeUI() {
		const creditInput = dom('credit-input');

		// persist the state of the UI
		persistCheckbox('remove-parsed-lines');
		await persistCheckbox('parser-autofocus');
		persistDetails('credit-parser-config').then((config) => {
			// hidden pattern inputs have a zero width, so they have to be resized if the config has not been open initially
			if (!config.open) {
				config.addEventListener('toggle', () => {
					qsa('input.pattern', config).forEach((input) => automaticWidth.call(input));
				}, { once: true });
			}
		});

		// auto-resize the credit textarea on input
		creditInput.addEventListener('input', automaticHeight);

		// load seeded data from hash
		const seededData = new URLSearchParams(window.location.hash.slice(1));
		const seededCredits = seededData.get('credits');
		if (seededCredits) {
			setTextarea(creditInput, seededCredits);
			const seededEditNote = seededData.get('edit-note');
			if (seededEditNote) {
				addMessageToEditNote(seededEditNote);
			}
		}

		addButton('Load annotation', (creditInput) => {
			/** @type {ReleaseT} */
			const release = MB.getSourceEntityInstance();
			const annotation = release.latest_annotation;
			if (annotation) {
				setTextarea(creditInput, annotation.text);
			}
		});

		addPatternInput({
			label: 'Credit terminator',
			description: 'Matches the end of a credit (default when empty: end of line)',
			defaultValue: parserDefaults.terminatorRE,
		});

		addPatternInput({
			label: 'Credit separator',
			description: 'Splits a credit into role and artist (disabled when empty)',
			defaultValue: /\s[–-]\s|:\s|\t+/,
		});

		addPatternInput({
			label: 'Name separator',
			description: 'Splits the extracted name into multiple names (disabled when empty)',
			defaultValue: parserDefaults.nameSeparatorRE,
		});

		// trigger all additional UI build tasks
		document.dispatchEvent(new CustomEvent(uiReadyEventType));

		// focus the credit parser input (if this setting is enabled)
		if (dom('parser-autofocus').checked) {
			creditInput.scrollIntoView();
			creditInput.focus();
		}
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
	 * @param {(creditLine: string, event: MouseEvent) => import('@kellnerd/es-utils').MaybePromise<CreditParserLineStatus>} parser
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
				setTextarea(creditInput, skippedLines.join('\n'));
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
		const container = document.createElement('li');
		container.insertAdjacentHTML('beforeend', `<label for="${id}" title="${config.description}">${config.label}:</label>`);
		container.append(' ', patternInput, ' ', resetButton, ' ', explanationLink);
		dom('credit-patterns').appendChild(container);

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
	 * Sets the textarea to the given value and adjusts the height.
	 * @param {HTMLTextAreaElement} textarea 
	 * @param {string} value 
	 */
	function setTextarea(textarea, value) {
		textarea.value = value;
		automaticHeight.call(textarea);
	}

	/**
	 * Extracts the entity type and ID from a MusicBrainz URL (can be incomplete and/or with additional path components and query parameters).
	 * @param {string} url URL of a MusicBrainz entity page.
	 * @returns {{ type: CoreEntityTypeT | 'mbid', mbid: MB.MBID } | undefined} Type and ID.
	 */
	function extractEntityFromURL$1(url) {
		const entity = url.match(/(area|artist|event|genre|instrument|label|mbid|place|recording|release|release-group|series|url|work)\/([0-9a-f-]{36})(?:$|\/|\?)/);
		return entity ? {
			type: entity[1],
			mbid: entity[2]
		} : undefined;
	}

	/**
	 * @param {CoreEntityTypeT} entityType 
	 * @param {MB.MBID | 'add' | 'create'} mbid MBID of an existing entity or `create` for the entity creation page (`add` for releases).
	 */
	function buildEntityURL$1(entityType, mbid) {
		return `https://musicbrainz.org/${entityType}/${mbid}`;
	}

	/**
	 * @template Params
	 * @template Result
	 * @template {string | number} Key
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
	 * @template {string | number} Key
	 * @extends {FunctionCache<Params, Result, Key>}
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

	/** @type {SimpleCache<[entityType: CoreEntityTypeT, name: string], MB.MBID>} */
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

	function rateLimitedQueue(operation, interval) {
		let queue = Promise.resolve(); // empty queue is ready
		return (...args) => {
			const result = queue.then(() => operation(...args)); // queue the next operation
			// start the next delay, regardless of the last operation's success
			queue = queue.then(() => delay(interval), () => delay(interval));
			return result;
		};
	}

	/**
	 * Limits the number of requests for the given operation within a time interval.
	 * @template Params
	 * @template Result
	 * @param {(...args: Params) => Result} operation Operation that should be rate-limited.
	 * @param {number} interval Time interval (in ms).
	 * @param {number} requestsPerInterval Maximum number of requests within the interval.
	 * @returns {(...args: Params) => Promise<Result>} Rate-limited version of the given operation.
	 */
	function rateLimit(operation, interval, requestsPerInterval = 1) {
		if (requestsPerInterval == 1) {
			return rateLimitedQueue(operation, interval);
		}
		const queues = Array(requestsPerInterval).fill().map(() => rateLimitedQueue(operation, interval));
		let queueIndex = 0;
		return (...args) => {
			queueIndex = (queueIndex + 1) % requestsPerInterval; // use the next queue
			return queues[queueIndex](...args); // return the result of the operation
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
	function fetchEntity$1(url, inc) {
		const entity = extractEntityFromURL$1(url);
		if (!entity) throw new Error('Invalid entity URL');

		const endpoint = [entity.type, entity.mbid].join('/');
		return fetchFromAPI(endpoint, {}, inc);
	}

	/**
	 * Returns the entity of the desired type which is associated to the given resource URL.
	 * @param {CoreEntityTypeT} entityType Desired type of the entity.
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
	 * Creates a dialog to add a relationship to the given source entity.
	 * @param {Object} options 
	 * @param {CoreEntityT} [options.source] Source entity, defaults to the currently edited entity.
	 * @param {CoreEntityT | string} [options.target] Target entity object or name.
	 * @param {CoreEntityTypeT} [options.targetType] Target entity type, fallback if there is no full entity given.
	 * @param {number} [options.linkTypeId] Internal ID of the relationship type.
	 * @param {ExternalLinkAttrT[]} [options.attributes] Attributes for the relationship type.
	 * @param {boolean} [options.batchSelection] Batch-edit all selected entities which have the same type as the source.
	 * The source entity only acts as a placeholder in this case.
	 */
	async function createDialog({
		source = MB.relationshipEditor.state.entity,
		target,
		targetType,
		linkTypeId,
		attributes,
		batchSelection = false,
	} = {}) {
		const onlyTargetName = (typeof target === 'string');

		// prefer an explicit target entity option over only a target type
		if (target && !onlyTargetName) {
			targetType = target.entityType;
		}

		// open dialog modal for the source entity
		MB.relationshipEditor.dispatch({
			type: 'update-dialog-location',
			location: {
				source,
				batchSelection,
			},
		});

		// TODO: currently it takes ~2ms until `relationshipDialogDispatch` is exposed
		await waitFor(() => !!MB.relationshipEditor.relationshipDialogDispatch, 1);

		if (targetType) {
			MB.relationshipEditor.relationshipDialogDispatch({
				type: 'update-target-type',
				source,
				targetType,
			});
		}

		if (linkTypeId) {
			const linkTypeItem = await retry(() => {
				// the available items are only valid for the current target type,
				// ensure that they have already been updated after a target type change
				const availableLinkTypes = MB.relationshipEditor.relationshipDialogState.linkType.autocomplete.items;
				return availableLinkTypes.find((item) => (item.id == linkTypeId));
			}, { wait: 10 });

			if (linkTypeItem) {
				MB.relationshipEditor.relationshipDialogDispatch({
					type: 'update-link-type',
					source,
					action: {
						type: 'update-autocomplete',
						source,
						action: {
							type: 'select-item',
							item: linkTypeItem,
						},
					},
				});
			}
		}

		if (attributes) {
			setAttributes(attributes);
		}

		if (!target) return;

		/** @type {AutocompleteActionT[]} */
		const autocompleteActions = onlyTargetName ? [{
			type: 'type-value',
			value: target,
		}, { // search dropdown is unaffected by future actions which set credits or date periods
			type: 'search-after-timeout',
			searchTerm: target,
		}] : [{
			type: 'select-item',
			item: entityToSelectItem(target),
		}];

		// autofill the target entity as good as possible
		autocompleteActions.forEach((autocompleteAction) => {
			MB.relationshipEditor.relationshipDialogDispatch({
				type: 'update-target-entity',
				source,
				action: {
					type: 'update-autocomplete',
					source,
					action: autocompleteAction,
				},
			});
		});

		// focus target entity input if it could not be auto-selected
		if (onlyTargetName) {
			qs('input.relationship-target').focus();
		}
	}

	/**
	 * Creates a dialog to batch-add a relationship to each of the selected source entities.
	 * @param {import('weight-balanced-tree').ImmutableTree<CoreEntityT>} sourceSelection Selected source entities.
	 * @param {Omit<Parameters<typeof createDialog>[0], 'batchSelection' | 'source'>} options
	 */
	function createBatchDialog(sourceSelection, options = {}) {
		return createDialog({
			...options,
			source: sourceSelection.value, // use the root node entity as a placeholder
			batchSelection: true,
		});
	}

	/**
	 * Resolves after the current/next relationship dialog has been closed.
	 * @returns {Promise<RelationshipDialogFinalStateT>} The final state of the dialog when it was closed by the user.
	 */
	async function closingDialog() {
		return new Promise((resolve) => {
			// wait for the user to accept or cancel the dialog
			document.addEventListener('mb-close-relationship-dialog', (event) => {
				const finalState = event.dialogState;
				finalState.closeEventType = event.closeEventType;
				resolve(finalState);
			}, { once: true });
		});
	}

	/** @param {string} creditedAs Credited name of the target entity. */
	function creditTargetAs(creditedAs) {
		MB.relationshipEditor.relationshipDialogDispatch({
			type: 'update-target-entity',
			source: MB.relationshipEditor.state.dialogLocation.source,
			action: {
				type: 'update-credit',
				action: {
					type: 'set-credit',
					creditedAs,
				},
			},
		});
	}

	/**
	 * Sets the relationship attributes of the current dialog.
	 * @param {ExternalLinkAttrT[]} attributes 
	 */
	function setAttributes(attributes) {
		MB.relationshipEditor.relationshipDialogDispatch({
			type: 'set-attributes',
			attributes,
		});
	}

	/**
	 * @param {EntityItemT} entity 
	 * @returns {OptionItemT}
	 */
	function entityToSelectItem(entity) {
		return {
			type: 'option',
			id: entity.id,
			name: entity.name,
			entity,
		};
	}

	/**
	 * @typedef {import('../types/MBS/scripts/autocomplete2.js').EntityItemT} EntityItemT
	 * @typedef {import('../types/MBS/scripts/autocomplete2.js').OptionItemT<EntityItemT>} OptionItemT
	 * @typedef {import('../types/MBS/scripts/autocomplete2.js').ActionT<EntityItemT>} AutocompleteActionT
	 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').ExternalLinkAttrT} ExternalLinkAttrT
	 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').RelationshipDialogStateT & { closeEventType: 'accept' | 'cancel' }} RelationshipDialogFinalStateT
	 */

	/**
	 * @param {CoreEntityTypeT} sourceType 
	 * @param {CoreEntityTypeT} targetType 
	 */
	function isRelBackward(sourceType, targetType, changeDirection = false) {
		if (sourceType === targetType) return changeDirection;
		return sourceType > targetType;
	}

	/**
	 * Taken from https://github.com/metabrainz/musicbrainz-server/blob/bf0d5ec41c7ddb6c5a8396bf3a64f74acaef9337/root/static/scripts/relationship-editor/hooks/useRelationshipDialogContent.js
	 * @type {Partial<import('../types/MBS/scripts/relationship-editor/state').RelationshipStateT>}
	 */
	const RELATIONSHIP_DEFAULTS = {
		_lineage: [],
		_original: null,
		_status: 1, // add relationship
		attributes: null,
		begin_date: null,
		editsPending: false,
		end_date: null,
		ended: false,
		entity0_credit: '',
		entity1_credit: '',
		id: null,
		linkOrder: 0,
		linkTypeID: null,
	};

	/**
	 * Creates a relationship between the given source and target entity.
	 * @param {RelationshipProps & { source?: CoreEntityT, target: CoreEntityT, batchSelectionCount?: number }} options
	 * @param {CoreEntityT} [options.source] Source entity, defaults to the currently edited entity.
	 * @param {CoreEntityT} options.target Target entity.
	 * @param {number} [options.batchSelectionCount] Batch-edit all selected entities which have the same type as the source.
	 * The source entity only acts as a placeholder in this case.
	 * @param {RelationshipProps} props Relationship properties.
	 */
	function createRelationship({
		source = MB.relationshipEditor.state.entity,
		target,
		batchSelectionCount = null,
		...props
	}) {
		const backward = isRelBackward(source.entityType, target.entityType, props.backward ?? false);

		MB.relationshipEditor.dispatch({
			type: 'update-relationship-state',
			sourceEntity: source,
			batchSelectionCount,
			creditsToChangeForSource: '',
			creditsToChangeForTarget: '',
			newRelationshipState: {
				...RELATIONSHIP_DEFAULTS,
				entity0: backward ? target : source,
				entity1: backward ? source : target,
				id: MB.relationshipEditor.getRelationshipStateId(),
				...props,
			},
			oldRelationshipState: null,
		});
	}

	/**
	 * Creates the same relationship between each of the selected source entities and the given target entity.
	 * @param {import('weight-balanced-tree').ImmutableTree<CoreEntityT>} sourceSelection Selected source entities.
	 * @param {CoreEntityT} target Target entity.
	 * @param {RelationshipProps} props Relationship properties.
	 */
	function batchCreateRelationships(sourceSelection, target, props) {
		return createRelationship({
			source: sourceSelection.value, // use the root node entity as a placeholder
			target,
			batchSelectionCount: sourceSelection.size,
			...props,
		});
	}

	/**
	 * Converts the given relationship attribute(s) into a tree which contains their full attribute type properties.
	 * @param {ExternalLinkAttrT[]} attributes Distinct attributes, ordered by type ID.
	 * @returns {LinkAttrTree}
	 */
	function createAttributeTree(...attributes) {
		return MB.tree.fromDistinctAscArray(attributes
			.map((attribute) => {
				const attributeType = MB.linkedEntities.link_attribute_type[attribute.type.gid];
				return {
					...attribute,
					type: attributeType,
					typeID: attributeType.id,
				};
			})
		);
	}

	/**
	 * @typedef {import('weight-balanced-tree').ImmutableTree<LinkAttrT>} LinkAttrTree
	 * @typedef {Partial<Omit<RelationshipT, 'attributes'> & { attributes: LinkAttrTree }>} RelationshipProps
	 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').ExternalLinkAttrT} ExternalLinkAttrT
	 */

	/**
	 * Fetches the entity with the given MBID from the internal API ws/js.
	 * @param {MB.MBID} gid MBID of the entity.
	 * @returns {Promise<CoreEntityT>}
	 */
	async function fetchEntity(gid) {
		const result = await fetch(`/ws/js/entity/${gid}`);
		return result.json();
	}

	/**
	 * Temporary cache for fetched entities from the ws/js API.
	 */
	const entityCache = new FunctionCache(fetchEntity, {
		keyMapper: (gid) => [gid],
	});

	/**
	 * Default punctuation rules.
	 * @type {import('../types.js').SubstitutionRule[]}
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
		en: ['“$1”', '‘$1’'], // English
		fr: ['« $1 »', '‹ $1 ›'], // French
		de: ['„$1“', '‚$1‘'], // German
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
		de: [ // German
			[/(\w+)-(\s)|(\s)-(\w+)/g, '$1$3‐$2$4'], // hyphens for abbreviated compound words
		],
		ja: [ // Japanese
			[/(?<=[^\p{L}\d]|^)-(.+?)-(?=[^\p{L}\d]|$)/ug, '–$1–'], // dashes used as brackets
		],
	};

	/**
	 * Creates language-specific punctuation guessing substitution rules.
	 * @param {string} [language] ISO 639-1 two letter code of the language.
	 */
	function punctuationRulesForLanguage(language) {
		// create a deep copy of the quotation rules to prevent modifications of the default rules
		let rules = punctuationRules.map((rule, index) => quotationRuleIndices.includes(index) ? [...rule] : rule);

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
	 * @param {string} [language] Language of the text (ISO 639-1 two letter code, optional).
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
	 * Adds a voice actor relationship for the given artist and their role.
	 * Automatically maps artist names to MBIDs where possible, asks the user to match the remaining ones.
	 * If recordings are selected, the voice actor relationships will be added to these, otherwise they target the release.
	 * @param {string} artistName Artist name (as credited).
	 * @param {string} roleName Credited role of the artist.
	 * @param {boolean} [bypassCache] Bypass the name to MBID cache to overwrite wrong entries, disabled by default.
	 * @returns {Promise<CreditParserLineStatus>}
	 */
	async function addVoiceActor(artistName, roleName, bypassCache = false) {
		const artistMBID = !bypassCache && await nameToMBIDCache.get('artist', artistName);

		/** @type {import('weight-balanced-tree').ImmutableTree<RecordingT> | null} */
		const recordings = MB.relationshipEditor.state.selectedRecordings;

		if (artistMBID) {
			// mapping already exists, automatically add the relationship
			const artist = await entityCache.get(artistMBID);
			createVoiceActorRelationship({ artist, roleName, artistCredit: artistName, recordings });

			return 'done';
		} else {
			// pre-fill dialog and collect mappings for freshly matched artists
			const artistMatch = await letUserSelectVoiceActor({ artistName, roleName, artistCredit: artistName, recordings });

			if (artistMatch?.gid) {
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
				createVoiceActorRelationship({ artist: mbArtist, roleName, artistCredit });
				mappedCredits++;
				// duplicates of already existing rels will be merged automatically
			} else {
				// pre-fill dialog and collect mappings for freshly matched artists
				const artistMatch = await letUserSelectVoiceActor({ artistName: actor.name, roleName, artistCredit });

				if (artistMatch?.gid) {
					discogsToMBIDCache.set(['artist', actor.id], artistMatch.gid);
					unmappedArtists.push({
						MBID: artistMatch.gid,
						name: artistMatch.name,
						comment: artistMatch.comment,
						externalURL: buildEntityURL('artist', actor.id),
						externalName: actor.name,
					});
				}
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

	async function letUserSelectVoiceActor({ artistName, roleName, artistCredit, recordings }) {
		await createVoiceActorDialog({ artist: artistName, roleName, artistCredit, recordings });

		// let the user select the matching entity
		const finalState = await closingDialog();

		// only use the selected target artist of accepted dialogs
		if (finalState.closeEventType === 'accept') {
			return finalState.targetEntity.target;
		}
	}

	/**
	 * Creates an "Add relationship" dialogue where the type "vocals" and the attribute "spoken vocals" are pre-selected.
	 * Optionally the performing artist (voice actor) and the name of the role can be pre-filled.
	 * @param {Object} [options]
	 * @param {string | ArtistT} [options.artist] Performing artist object or name (optional).
	 * @param {string} [options.roleName] Credited name of the voice actor's role (optional).
	 * @param {string} [options.artistCredit] Credited name of the performing artist (optional).
	 * @param {import('weight-balanced-tree').ImmutableTree<RecordingT>} [options.recordings]
	 * Recordings to create the dialog for (fallback to release).
	 */
	async function createVoiceActorDialog({ artist, roleName, artistCredit, recordings } = {}) {
		const vocalAttributes = [{
			type: { gid: 'd3a36e62-a7c4-4eb9-839f-adfebe87ac12' }, // spoken vocals
			credited_as: roleName,
		}];

		if (recordings) {
			await createBatchDialog(recordings, {
				target: artist,
				targetType: 'artist',
				linkTypeId: 149, // performance -> performer -> vocals
				attributes: vocalAttributes,
			});
		} else {
			await createDialog({
				target: artist,
				targetType: 'artist',
				linkTypeId: 60, // performance -> performer -> vocals
				attributes: vocalAttributes,
			});
		}

		if (artistCredit) {
			creditTargetAs(artistCredit);
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {ArtistT} options.artist The performing artist.
	 * @param {string} [options.roleName] Credited name of the voice actor's role (optional).
	 * @param {string} [options.artistCredit] Credited name of the performing artist (optional).
	 * @param {import('weight-balanced-tree').ImmutableTree<RecordingT>} [options.recordings]
	 * Recordings to create the relationships for (fallback to release).
	 */
	function createVoiceActorRelationship({ artist, roleName, artistCredit, recordings }) {
		const vocalAttributes = createAttributeTree({
			type: { gid: 'd3a36e62-a7c4-4eb9-839f-adfebe87ac12' }, // spoken vocals
			credited_as: roleName,
		});

		if (recordings) {
			batchCreateRelationships(recordings, artist, {
				linkTypeID: 149, // performance -> performer -> vocals
				entity0_credit: artistCredit,
				attributes: vocalAttributes,
			});
		} else {
			createRelationship({
				target: artist,
				linkTypeID: 60, // performance -> performer -> vocals
				entity0_credit: artistCredit,
				attributes: vocalAttributes,
			});
		}
	}

	const UI = `
<div id="credit-import-tools">
	<div id="credit-import-status" class="row no-label"></div>
	<div id="credit-import-errors" class="row no-label error"></div>
</div>`;

	function buildVoiceActorCreditParserUI() {
		const creditSeparatorInput = dom('credit-separator');

		nameToMBIDCache.load();

		addParserButton('Parse voice actor credits', async (creditLine, event) => {
			const creditTokens = creditLine.split(getPattern(creditSeparatorInput.value) || /$/);

			if (creditTokens.length === 2) {
				let [roleName, artistName] = creditTokens.map((token) => guessUnicodePunctuation(token.trim()));

				const swapNames = event.shiftKey;
				if (swapNames) {
					[artistName, roleName] = [roleName, artistName];
				}

				const bypassCache = event.ctrlKey;
				const result = await addVoiceActor(artistName, roleName, bypassCache);
				nameToMBIDCache.store();
				return result;
			} else {
				return 'skipped';
			}
		}, [
			'SHIFT key to swap the order of artist names and their role names',
			'CTRL key to bypass the cache and force a search',
		].join('\n'));
	}

	function buildVoiceActorCreditImporterUI() {
		discogsToMBIDCache.load();

		dom('credit-parser').insertAdjacentHTML('beforeend', UI);

		addButton('Import voice actors', async () => {
			const releaseData = await fetchEntity$1(window.location.href, ['release-groups', 'url-rels']);
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

	buildCreditParserUI(buildVoiceActorCreditParserUI, buildVoiceActorCreditImporterUI);

})();
