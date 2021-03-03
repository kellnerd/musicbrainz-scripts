import { guessUnicodePunctuation } from '../guessUnicodePunctuation';
import guessPunctuationIcon from './icons/guessPunctuation.png';

const pageEntityType = window.location.pathname.split('/')[1];

// insert a "Guess punctuation" button on all entity edit and creation pages
if (pageEntityType == 'release') {
	$('<button type="button">Guess punctuation</button>')
		.on('click', () => {
			guessUnicodePunctuation([
				'input#name', // release title
				'input#comment', // release title
				'input.track-name', // all track titles
				'input[id^=disc-title]', // all medium titles
			]);
		})
		.appendTo('.guesscase .buttons'); // insert button after the guess case button in the tracklist tab
} else { // all other entity types (except url): artist, event, label, place, recording, release group, series, work
	const button = $('<button class="icon" type="button" title="Guess punctuation"></button>')
		.on('click', () => {
			guessUnicodePunctuation([
				'input[name$=\\.name]', // entity name
				'input[name$=\\.comment]', // entity disambiguation comment
			]);
		})
		.css('background-image', `url(${guessPunctuationIcon})`); // icon button with a custom image
	$('input[name$=\\.comment]')
		.addClass('with-guesscase') // make input smaller to create space for up to two icon buttons
		.after(' ', button); // insert white space and button to the right of the disambiguation comment input field
}
