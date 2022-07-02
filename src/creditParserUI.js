import { addMessageToEditNote } from './editNote.js';
import { parserDefaults } from './parseCopyrightNotice.js';
import { releaseLoadingFinished } from './relationshipEditor.js';
import { automaticHeight, automaticWidth } from '../utils/dom/autoResize.js';
import { createElement, injectStylesheet } from '../utils/dom/create.js';
import { dom, qs } from '../utils/dom/select.js';
import { getPattern, getPatternAsRegExp } from '../utils/regex/parse.js';
import { slugify } from '../utils/string/casingStyle.js';
import {
	persistCheckbox,
	persistDetails,
	persistInput,
} from '../utils/userscript/persistElement.js';

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
</details>`;

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
}`;

const uiReadyEventType = 'credit-parser-ui-ready';

/**
 * Injects the basic UI of the credit parser and waits until the UI has been expanded before it continues with the build tasks.
 * @param {...(() => void)} buildTasks Handlers which can be registered for additional UI build tasks.
 */
export function buildCreditParserUI(...buildTasks) {
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
export function addButton(label, clickHandler, description) {
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
export function addParserButton(label, parser, description) {
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
