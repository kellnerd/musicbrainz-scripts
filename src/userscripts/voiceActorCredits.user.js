import { createVoiceActorDialog } from '../voiceActorCredits.js';

const button =
`<span class="add-rel btn" id="add-voice-actor-credit">
	<img class="bottom" src="https://staticbrainz.org/MB/add-e585eab.png">
	Add voice actor relationship
</span>`;

function insertVoiceActorButton() {
	$(button)
		.on('click', (event) => createVoiceActorDialog().open(event))
		.appendTo('#release-rels');
}

insertVoiceActorButton();
