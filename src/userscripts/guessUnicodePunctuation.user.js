import { guessUnicodePunctuation } from '../guessUnicodePunctuation';

const releaseEditorTitleInputs = [
	'input#name', // release title
	'input.track-name', // all track titles
	'input[id^=disc-title]', // all medium titles
];

// insert a "Guess punctuation" button next to the "Guess case" button
const button = $('<button type="button">Guess punctuation</button>');
$(button).on('click', () => {
	guessUnicodePunctuation(releaseEditorTitleInputs);
});
$('.guesscase .buttons').append(button);
