import {
	createVoiceActorDialog,
	importVoiceActorsFromDiscogs,
} from '../voiceActorCredits.js';

const button =
`<span class="add-rel btn" id="add-voice-actor-credit">
	<img class="bottom" src="https://staticbrainz.org/MB/add-384fe8d.png">
	Add voice actor relationship
</span>`;

function insertVoiceActorButton() {
	$(button)
		.on('click', (event) => {
			// const input = prompt('Discogs release URL', 'https://www.discogs.com/release/605682');
			const input = 'https://www.discogs.com/release/605682';
			if (input) {
				importVoiceActorsFromDiscogs(input, event);
			} else {
				createVoiceActorDialog().open(event);
			}
		})
		.appendTo('#release-rels');
}

insertVoiceActorButton();
