import { addCopyrightRelationships } from '../copyrightRelationships.js';
import { dom } from '../dom.js';
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
<summary style="color: #EB743B; cursor: pointer;">
	<h2 style="display: inline;">Credit Parser</h2>
</summary>
<form>
	<div class="row">
		<textarea name="credit-input" id="credit-input" cols="80" rows="10" placeholder="Paste credits here"></textarea>
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

function buildUI() {
	dom('release-rels').insertAdjacentHTML('afterend', creditParserUI);

	persistDetails('credit-parser');
	persistCheckbox('remove-parsed-lines');

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
		}
	});
}

nameToMBIDCache.load();
buildUI();
