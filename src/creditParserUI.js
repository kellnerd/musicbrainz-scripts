import {
	createElement,
	dom,
	injectStylesheet,
	qs,
} from './dom.js';
import { addMessageToEditNote } from './editNote.js';
import {
	persistCheckbox,
	persistDetails,
} from './persistElement.js';

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
		<p>Identified relationships will be added to the release and/or the matching recordings and works (only if these are selected).</p>
	</div>
	<div class="row">
		<input type="checkbox" name="remove-parsed-lines" id="remove-parsed-lines" />
		<label class="inline" for="remove-parsed-lines">Remove parsed lines</label>
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
}`;

export function buildCreditParserUI() {
	// possibly called by multiple userscripts, do not inject the UI again
	if (dom('credit-parser')) return;

	dom('release-rels').insertAdjacentHTML('afterend', creditParserUI);
	injectStylesheet(css, 'credit-parser');

	// persist the state of the UI
	persistDetails('credit-parser');
	persistCheckbox('remove-parsed-lines');

	// auto-resize the credit textarea on input (https://stackoverflow.com/a/25621277)
	dom('credit-input').addEventListener('input', function () {
		this.style.height = 'auto';
		this.style.height = this.scrollHeight + 'px';
	});
}

/**
 * Adds a new button with the given label and click handler to the credit parser UI.
 * @param {string} label 
 * @param {(event: MouseEvent, creditInput: HTMLTextAreaElement) => any} clickHandler 
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

	button.addEventListener('click', (event) => clickHandler(event, creditInput));

	return qs('#credit-parser .buttons').appendChild(button);
}

/**
 * Adds a new parser button with the given label and handler to the credit parser UI.
 * @param {string} label 
 * @param {(credits: string, event: MouseEvent) => Promise<boolean> | boolean} parser
 * Handler which parses the given credits and returns whether it has successful.
 * @param {string} [description] Description of the button, shown as tooltip.
 */
export function addParserButton(label, parser, description) {
	/** @type {HTMLInputElement} */
	const removeParsedLines = dom('remove-parsed-lines');

	return addButton(label, async (event, creditInput) => {
		const credits = creditInput.value.trim();
		if (credits) {
			const parserSucceeded = await parser(credits, event);
			if (parserSucceeded) {
				addMessageToEditNote(credits);
				if (removeParsedLines.checked) {
					creditInput.value = '';
					creditInput.dispatchEvent(new Event('input'));
				}
			}
		}
	}, description);
}
