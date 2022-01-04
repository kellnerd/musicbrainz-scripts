import { addMessageToEditNote } from '../editNote.js';
import {
	addCopyrightRelationships,
	parseCopyrightText,
} from '../parseCopyrightText.js';

const addIcon = $('img', '.add-rel.btn').attr('src');

const parseCopyrightButton =
`<span class="add-rel btn" id="parse-copyright" title="ALT key for automatic matching">
	<img class="bottom" src="${addIcon}">
	Parse copyright text
</span>`;

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
