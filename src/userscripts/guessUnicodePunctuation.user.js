import DOM from '../dom.js';
import {
	guessUnicodePunctuation,
	transformationRulesToPreserveMarkup,
} from '../guessUnicodePunctuation.js';
import { detectReleaseLanguage } from '../languages.js';
import { transformInputValues } from '../transformInputValues.js';
import guessPunctuationIcon from './icons/guessPunctuation.png';

const buttonTemplate = {
	standard: '<button type="button">Guess punctuation</button>',
	global: '<button type="button" title="Guess punctuation for all supported input fields">Guess punctuation</button>',
	icon: '<button class="icon guess-punctuation" type="button" title="Guess punctuation"></button>',
};

const styles =
`button.icon.guess-punctuation {
	background-image: url(${guessPunctuationIcon});
}
input.content-changed, textarea.content-changed {
	background-color: yellow !important;
}`;

/**
 * Inserts a "Guess punctuation" icon button to the right of the given input field.
 * @param {string} targetInput CSS selector of the input field.
 * @returns {HTMLButtonElement} DOM button element.
 */
function insertIconButtonAfter(targetInput) {
	const target = DOM.qs(targetInput);
	if (!target) return null;
	const button = DOM.el(buttonTemplate.icon);
	target.classList.add('with-guesscase') // make input smaller to create space for up to two icon buttons
	target.parentNode.append(' ', button); // insert white space and button to the right of the input field
	return button;
}

DOM.css(styles, 'guess-punctuation');

// parse the path of the current page
const path = window.location.pathname.split('/');
const entityType = path[1], pageType = path[path.length - 1];

// insert "Guess punctuation" buttons on all entity edit and creation pages
if (pageType == 'edit_annotation') { // annotation edit page
	// insert button for entity annotations after the "Preview" button
	const button = DOM.el(buttonTemplate.standard);
	button.addEventListener('click', () => transformInputValues('textarea[name$=text]', transformationRulesToPreserveMarkup));
	DOM.qs('.buttons').append(button);
} else if (entityType == 'release') { // release editor
	const releaseInputs = [
		'input#name', // release title
		'input#comment', // release disambiguation comment
	];
	const tracklistInputs = [
		'input.track-name', // all track titles
		'input[id^=medium-title]', // all medium titles
	];
	// button for the release information tab (after disambiguation comment input field)
	insertIconButtonAfter(releaseInputs[1])
		.addEventListener('click', () => {
			guessUnicodePunctuation(releaseInputs, detectReleaseLanguage());
			transformInputValues('#annotation', transformationRulesToPreserveMarkup); // release annotation
		});
	// button for the tracklist tab (after the guess case button)
	const tracklistButton = DOM.el(buttonTemplate.standard);
	tracklistButton.addEventListener('click', () => guessUnicodePunctuation(tracklistInputs, detectReleaseLanguage()));
	DOM.qs('.guesscase .buttons').append(tracklistButton);
	// global button (next to the release editor navigation buttons)
	const globalButton = DOM.el(buttonTemplate.global);
	globalButton.addEventListener('click', () => {
		guessUnicodePunctuation([...releaseInputs, ...tracklistInputs], detectReleaseLanguage()); // both release info and tracklist data
		transformInputValues('#edit-note-text', transformationRulesToPreserveMarkup); // edit note
		// exclude annotations from the global action as the changes are hard to verify
	});
	DOM.qs('#release-editor > .buttons').append(globalButton);
} else { // edit pages for all other entity types
	const entityInputs = [
		'input[name$=name]', // entity name
		'input[name$=comment]', // entity disambiguation comment
	];
	// button after the disambiguation comment input field
	// tested for: area, artist, event, instrument, label, place, recording, release group, series, work
	// TODO: use lyrics language to localize quotes?
	insertIconButtonAfter(entityInputs[1]) // skipped for url entities as there is no disambiguation input
		?.addEventListener('click', () => guessUnicodePunctuation(entityInputs));
	// global button after the "Enter edit" button
	const button = DOM.el(buttonTemplate.global)
	button.addEventListener('click', () => {
		guessUnicodePunctuation(entityInputs);
		transformInputValues('.edit-note', transformationRulesToPreserveMarkup); // edit note
	});
	DOM.qs('button.submit').parentNode.append(button);
}
