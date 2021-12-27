import {
	createVoiceActorDialog,
} from '../relationshipEditor.js';
import {
	importVoiceActorsFromDiscogs,
} from '../voiceActorCredits.js';

const addIcon = $('img', '.add-rel.btn').attr('src');

const addButton =
`<span class="add-rel btn" id="add-voice-actor-credit">
	<img class="bottom" src="${addIcon}">
	Add voice actor relationship
</span>`;

const importButton =
`<span class="add-rel btn" id="import-voice-actors">
	<img class="bottom" src="${addIcon}">
	Import voice actors
</span>`;

function insertVoiceActorButtons() {
	$(addButton)
		.on('click', (event) => createVoiceActorDialog().open(event))
		.appendTo('#release-rels');
	$(importButton)
		.on('click', (event) => {
			// const input = prompt('Discogs release URL', 'https://www.discogs.com/release/605682');
			// TODO: detect Discogs link (and RG type?) of the MB release
			const releaseURL = 'https://www.discogs.com/release/605682';
			importVoiceActorsFromDiscogs(releaseURL, event);
		})
		.appendTo('#release-rels');
}

insertVoiceActorButtons();
