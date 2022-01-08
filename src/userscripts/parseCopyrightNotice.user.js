import { addCopyrightRelationships } from '../copyrightRelationships.js';
import { dom, injectStylesheet } from '../dom.js';
import { addMessageToEditNote } from '../editNote.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import {
	parseCopyrightNotice,
} from '../parseCopyrightNotice.js';
import {
	persistCheckbox,
	persistDetails,
} from '../persistElement.js';

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
		<button type="button" id="parse-copyright">Parse copyright notice</button>
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

function buildUI() {
	dom('release-rels').insertAdjacentHTML('afterend', creditParserUI);
	injectStylesheet(css, 'credit-parser');

	// persist the state of the UI
	persistDetails('credit-parser');
	persistCheckbox('remove-parsed-lines');

	// auto-resize the credit textarea (https://stackoverflow.com/a/25621277)
	dom('credit-input').addEventListener('input', function () {
		this.style.height = 'auto';
		this.style.height = this.scrollHeight + 'px';
	});

	// register button handlers
	dom('parse-copyright').addEventListener('click', async (event) => {
		/** @type {HTMLTextAreaElement} */
		const textarea = dom('credit-input');
		const input = textarea.value.trim();
		if (input) {
			const copyrightInfo = parseCopyrightNotice(input);
			const automaticMode = event.altKey;
			await addCopyrightRelationships(copyrightInfo, automaticMode);
			addMessageToEditNote(input);
			nameToMBIDCache.store();
		}
		if (dom('remove-parsed-lines').checked) {
			textarea.value = '';
			textarea.dispatchEvent(new Event('input'));
		}
	});
}

nameToMBIDCache.load();
buildUI();
