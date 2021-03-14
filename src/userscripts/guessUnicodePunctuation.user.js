import {
	guessUnicodePunctuation,
	transformationRulesToPreserveMarkup,
} from '../guessUnicodePunctuation';
import { transformInputValues } from '../transformInputValues';
import guessPunctuationIcon from './icons/guessPunctuation.png';

const buttonTemplate = {
	standard: '<button type="button">Guess punctuation</button>',
	global: '<button type="button" title="Guess punctuation for all supported input fields">Guess punctuation</button>',
	icon: '<button class="icon" type="button" title="Guess punctuation"></button>',
};

/**
 * Inserts a "Guess punctuation" icon button to the right of the given input field.
 * @param {string} targetInput CSS selector of the input field.
 * @returns {JQuery<HTMLElement>} jQuery button element.
 */
function insertIconButtonAfter(targetInput) {
	const button = $(buttonTemplate.icon)
		.css('background-image', `url(${guessPunctuationIcon})`); // icon button with a custom image
	$(targetInput)
		.addClass('with-guesscase') // make input smaller to create space for up to two icon buttons
		.after(' ', button); // insert white space and button to the right of the input field
	return button;
}

// parse the path of the current page
const path = window.location.pathname.split('/');
const entityType = path[1], pageType = path[path.length - 1];

// insert "Guess punctuation" buttons on all entity edit and creation pages
if (pageType == 'edit_annotation') { // annotation edit page
	// insert button for entity annotations after the "Preview" button
	$(buttonTemplate.standard)
		.on('click', () => transformInputValues('#id-edit-annotation\\.text', transformationRulesToPreserveMarkup))
		.appendTo('.buttons');
} else if (entityType == 'release') { // release editor
	const releaseInputs = [
		'input#name', // release title
		'input#comment', // release disambiguation comment
	];
	const tracklistInputs = [
		'input.track-name', // all track titles
		'input[id^=disc-title]', // all medium titles
	];
	// button for the release information tab (after disambiguation comment input field)
	insertIconButtonAfter('input#comment')
		.on('click', () => {
			guessUnicodePunctuation(releaseInputs);
			transformInputValues('#annotation', transformationRulesToPreserveMarkup); // release annotation
		});
	// button for the tracklist tab (after the guess case button)
	$(buttonTemplate.standard)
		.on('click', () => guessUnicodePunctuation(tracklistInputs))
		.appendTo('.guesscase .buttons');
	// global button (next to the release editor navigation buttons)
	$(buttonTemplate.global)
		.on('click', () => {
			guessUnicodePunctuation([...releaseInputs, ...tracklistInputs]); // both release info and tracklist data
			transformInputValues('#edit-note-text', transformationRulesToPreserveMarkup); // edit note
			// exclude annotations from the global action as the changes are hard to verify
		})
		.appendTo('#release-editor > .buttons');
} else { // edit pages for all other entity types (except url)
	const entityInputs = [
		'input[name$=\\.name]', // entity name
		'input[name$=\\.comment]', // entity disambiguation comment
	];
	// button after the disambiguation comment input field
	// tested for: area, artist, event, instrument, label, place, recording, release group, series, work
	insertIconButtonAfter('input[name$=\\.comment]')
		.on('click', () => guessUnicodePunctuation(entityInputs));
	// global button after the "Enter edit" button
	$(buttonTemplate.global)
		.on('click', () => {
			guessUnicodePunctuation(entityInputs);
			transformInputValues('.edit-note', transformationRulesToPreserveMarkup); // edit note
		})
		.insertAfter('button.submit');
}
