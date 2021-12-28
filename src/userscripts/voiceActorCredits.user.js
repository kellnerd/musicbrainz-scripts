import {
	fetchEntity,
} from '../publicAPI.js';
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
	// TODO: only show buttons for certain RG types (audiobook, audio drama, spoken word) of the MB release?
	$(addButton)
		.on('click', (event) => createVoiceActorDialog().open(event))
		.appendTo('#release-rels');
	$(importButton)
		.on('click', async (event) => {
			const releaseData = await fetchEntity(window.location.href, ['release-groups', 'url-rels']);
			let discogsURL = releaseData.relations.find((rel) => rel.type === 'discogs')?.url.resource;

			if (!discogsURL) {
				discogsURL = prompt('Discogs release URL');
			}

			if (discogsURL) {
				importVoiceActorsFromDiscogs(discogsURL, event);
			}
		})
		.appendTo('#release-rels');
}

insertVoiceActorButtons();
