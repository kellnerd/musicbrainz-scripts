import { addMessageToEditNote } from '../editNote.js';
import { buildEntityURL } from '../entity.js';
import { discogsToMBIDCache } from '../entityMapping.js';
import {
	fetchEntity,
} from '../publicAPI.js';
import {
	createVoiceActorDialog,
} from '../relationshipEditor.js';
import { seedURLForArtist } from '../seeding.js';
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

const UI =
`<div id="credit-import-tools">
	<div id="credit-import-status" class="row no-label"></div>
	<div id="credit-import-errors" class="row no-label error"></div>
</div>`;

function buildUI() {
	// TODO: only show buttons for certain RG types (audiobook, audio drama, spoken word) of the MB release?
	$(addButton)
		.on('click', (event) => createVoiceActorDialog().open(event))
		.appendTo('#release-rels');

	$(importButton)
		.on('click', async () => {
			const releaseData = await fetchEntity(window.location.href, ['release-groups', 'url-rels']);
			const releaseURL = buildEntityURL('release', releaseData.id)
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
					`<a href="${seedURLForArtist(match.MBID, match.externalURL, 180, artistSeedNote)}" target="_blank">${match.name}</a>`,
					match.comment ? `<span class="comment">(<bdi>${match.comment}</bdi>)</span>` : '',
				].join(' '));

				// import statistics
				const importedCredits = result.mappedCredits + newMatches.length;
				messages.unshift(`Successfully imported ${importedCredits} of ${result.totalCredits} credits, ${result.mappedCredits} of them were mapped automatically.`);

				$('#credit-import-status').html(messages.map((message) => `<p>${message}</p>`).join('\n'));
			}
		})
		.appendTo('#release-rels');

	$(UI).appendTo('#release-rels');
}

discogsToMBIDCache.load();
buildUI();
