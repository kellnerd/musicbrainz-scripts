import { addMessageToEditNote } from '../editNote.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import {
	addCopyrightRelationships,
	parseCopyrightNotice,
} from '../parseCopyrightNotice.js';

const addIcon = $('img', '.add-rel.btn').attr('src');

const parseCopyrightButton =
`<span class="add-rel btn" id="parse-copyright" title="ALT key for automatic matching">
	<img class="bottom" src="${addIcon}">
	Parse copyright notice
</span>`;

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
