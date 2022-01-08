import { addCopyrightRelationships } from '../copyrightRelationships.js';
import { buildCreditParserUI } from '../creditParserUI.js';
import { dom, qs } from '../dom.js';
import { addMessageToEditNote } from '../editNote.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import {
	parseCopyrightNotice,
} from '../parseCopyrightNotice.js';

function buildUI() {
	buildCreditParserUI();
	qs('#credit-parser .buttons').insertAdjacentHTML('beforeend',
		`<button type="button" id="parse-copyright">Parse copyright notice</button>`);

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
