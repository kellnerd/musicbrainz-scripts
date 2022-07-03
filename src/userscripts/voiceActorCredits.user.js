import {
	addButton,
	addParserButton,
	buildCreditParserUI,
} from '../creditParserUI.js';
import { addMessageToEditNote } from '../editNote.js';
import { buildEntityURL } from '../entity.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import { discogsToMBIDCache } from '../discogs/entityMapping.js';
import {
	fetchEntity,
} from '../publicAPI.js';
import {
	createVoiceActorDialog,
} from '../relationshipEditor.js';
import { seedURLForEntity } from '../seeding.js';
import {
	addVoiceActorRelationship,
	importVoiceActorsFromDiscogs,
} from '../voiceActorCredits.js';
import { createElement } from '../../utils/dom/create.js';
import { dom, qs } from '../../utils/dom/select.js';
import { guessUnicodePunctuation } from '../../utils/string/punctuation.js';

const UI =
`<div id="credit-import-tools">
	<div id="credit-import-status" class="row no-label"></div>
	<div id="credit-import-errors" class="row no-label error"></div>
</div>`;

// TODO: only show button for certain RG types (audiobook, audio drama, spoken word) of the MB release?
function injectAddVoiceActorButton() {
	const addIcon = qs('span.add-rel.btn > img')?.src;
	const addVoiceActorButton = createElement(`
	<span class="add-rel btn" id="add-voice-actor-credit">
		<img class="bottom" src="${addIcon}">Add voice actor relationship
	</span>`);

	addVoiceActorButton.addEventListener('click', (event) => createVoiceActorDialog().open(event));
	dom('release-rels').appendChild(addVoiceActorButton);
}

function buildVoiceActorCreditParserUI() {
	nameToMBIDCache.load();

	addParserButton('Parse voice actor credits', async (creditLine, event) => {
		const voiceActorCredit = creditLine.match(/^(.+)(?:\s[–-]\s|\t+)(.+)$/);

		if (voiceActorCredit) {
			let [roleName, artistName] = voiceActorCredit.slice(1).map((name) => guessUnicodePunctuation(name.trim()));

			const swapNames = event.shiftKey;
			if (swapNames) {
				[artistName, roleName] = [roleName, artistName];
			}

			const bypassCache = event.ctrlKey;
			const result = await addVoiceActorRelationship(artistName, roleName, bypassCache);
			nameToMBIDCache.store();
			return result;
		} else {
			return 'skipped';
		}
	}, [
		'SHIFT key to swap the order of artist names and their role names',
		'CTRL key to bypass the cache and force a search',
	].join('\n'));
}

function buildVoiceActorCreditImporterUI() {
	discogsToMBIDCache.load();

	dom('credit-parser').insertAdjacentHTML('beforeend', UI);

	addButton('Import voice actors', async () => {
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
				`<a href="${seedURLForEntity('artist', match.MBID, match.externalURL, 180, artistSeedNote)}" target="_blank">${match.name}</a>`,
				match.comment ? `<span class="comment">(<bdi>${match.comment}</bdi>)</span>` : '',
			].join(' '));

			// import statistics
			const importedCredits = result.mappedCredits + newMatches.length;
			messages.unshift(`Successfully imported ${importedCredits} of ${result.totalCredits} credits, ${result.mappedCredits} of them were mapped automatically.`);

			dom('credit-import-status').innerHTML = messages.map((message) => `<p>${message}</p>`).join('\n');
		}
	}, 'Import credits from Discogs');
}

injectAddVoiceActorButton();
buildCreditParserUI(buildVoiceActorCreditParserUI, buildVoiceActorCreditImporterUI);
