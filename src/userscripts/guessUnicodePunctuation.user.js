import {
	guessUnicodePunctuation,
	transformationRulesToPreserveMarkup,
} from '../guessUnicodePunctuation.js';
import { detectReleaseLanguage } from '../languages.js';
import { onReactHydrated } from '../reactHydration.js';
import { createElement, injectStylesheet } from '../../utils/dom/create.js';
import { qs, qsa } from '../../utils/dom/select.js';
import { transformInputValues, defaultHighlightClass } from '../../utils/dom/transformInputValues.js';

import guessPunctuationIcon from './icons/guessPunctuation.png';

const buttonTemplate = {
	standard: '<button type="button">Guess punctuation</button>',
	global: '<button type="button" title="Guess punctuation for all supported input fields">Guess punctuation</button>',
	icon: '<button class="icon guess-punctuation" type="button" title="Guess punctuation"></button>',
};

const styles = `
button.icon.guess-punctuation {
	background-image: url(${guessPunctuationIcon});
}
input.${defaultHighlightClass}, textarea.${defaultHighlightClass} {
	background-color: yellow !important;
}`;

/**
 * Inserts a "Guess punctuation" icon button to the right of the given input field.
 * @param {string} targetInput CSS selector of the input field.
 * @returns {HTMLButtonElement} DOM button element.
 */
function insertIconButtonAfter(targetInput) {
	const target = qs(targetInput);
	if (!target) return null;

	const button = createElement(buttonTemplate.icon);
	target.classList.add('with-guesscase') // make input smaller to create space for up to two icon buttons
	target.parentNode.append(' ', button); // insert white space and button to the right of the input field

	return button;
}

/**
 * Inserts a "Guess punctuation" button into the artist credit bubble of the edit page.
 * Only works if the bubble is already present in the DOM (it can be hidden, but must have been open at least once).
 * Therefore this function should be used as callback of an event listener.
 * @param {Event} event
 */
function insertACButton(event) {
	// remove this function from the event listeners after the first event to avoid duplicate buttons
	if (event) {
		qsa('.open-ac').forEach((button) => button.removeEventListener(event.type, insertACButton));
	}

	const acBubbleButtons = qs('#artist-credit-bubble .buttons');

	if (!acBubbleButtons) {
		setTimeout(insertACButton, 50); // wait for the AC bubble to appear in the DOM
		return;
	}

	const button = createElement(buttonTemplate.standard);
	button.addEventListener('click', () => guessUnicodePunctuation(acInputs, { isReactInput: true }));
	acBubbleButtons.append(button);
}

const acInputs = [
	'input[id*=credited-as]', // all artist names as credited (inside the artist credit bubble)
];

function buildUI() {
	injectStylesheet(styles, 'guess-punctuation');

	// parse the path of the current page
	const path = window.location.pathname.split('/');
	let entityType = path[1], pageType = path[path.length - 1];

	if (entityType == 'artist' && path[3] == 'credit') {
		entityType = 'artist-credit';
	}

	// insert "Guess punctuation" buttons on all entity edit and creation pages
	if (pageType == 'edit_annotation') { // annotation edit page
		// insert button for entity annotations after the "Preview" button
		const button = createElement(buttonTemplate.standard);
		button.addEventListener('click', () => transformInputValues('textarea[name$=text]', transformationRulesToPreserveMarkup));
		qs('.buttons').append(button);
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
				guessUnicodePunctuation(releaseInputs, { language: detectReleaseLanguage() });
				transformInputValues('#annotation', transformationRulesToPreserveMarkup); // release annotation
			});

		// button for the tracklist tab (after the guess case button)
		const tracklistButton = createElement(buttonTemplate.standard);
		tracklistButton.addEventListener('click', () => guessUnicodePunctuation(tracklistInputs, { language: detectReleaseLanguage() }));
		qs('.guesscase .buttons').append(tracklistButton);

		// global button (next to the release editor navigation buttons)
		const globalButton = createElement(buttonTemplate.global);
		globalButton.addEventListener('click', () => {
			// both release info and tracklist data
			guessUnicodePunctuation([...releaseInputs, ...tracklistInputs], { language: detectReleaseLanguage() });
			transformInputValues('#edit-note-text', transformationRulesToPreserveMarkup); // edit note
			// exclude annotations from the global action as the changes are hard to verify
		});
		qs('#release-editor > .buttons').append(globalButton);
	} else if (['add-alias', 'alias'].includes(pageType)) { // alias creation or edit page
		// global button after the "Enter edit" button
		const button = createElement(buttonTemplate.global);
		button.addEventListener('click', () => {
			guessUnicodePunctuation(['input[name$=name]']); // TODO: use locale
			transformInputValues('.edit-note', transformationRulesToPreserveMarkup); // edit note
		});
		qs('.buttons').append(button);
	} else if (entityType != 'artist-credit') { // edit pages for all other entity types (except ACs)
		const entityInputs = [
			'input[name$=name]', // entity name
			'input[name$=comment]', // entity disambiguation comment
		];

		// on artist edit pages we need a different event to trigger the artist credit renamer on name changes
		const event = (entityType === 'artist') ? new Event('input', { bubbles: true }) : undefined;

		// button after the disambiguation comment input field
		// tested for: area, artist, event, instrument, label, place, recording, release group, series, work
		// TODO: use lyrics language to localize quotes?
		insertIconButtonAfter(entityInputs[1]) // skipped for url entities as there is no disambiguation input
			?.addEventListener('click', () => guessUnicodePunctuation(entityInputs, { event }));

		// global button after the "Enter edit" button
		const button = createElement(buttonTemplate.global);
		button.addEventListener('click', () => {
			guessUnicodePunctuation(entityInputs, { event });
			transformInputValues('.edit-note', transformationRulesToPreserveMarkup); // edit note
		});
		qs('button.submit').parentNode.append(button);
	}

	// handle edit pages with artist credit bubbles
	if (['artist-credit', 'release', 'release-group', 'recording'].includes(entityType)) {
		// wait a moment until the button which opens the AC bubble is available
		setTimeout(() => qsa('.open-ac').forEach((button) => {
			// wait for the artist credit bubble to be opened before inserting the guess button
			button.addEventListener('click', insertACButton);

			if (entityType === 'release') {
				// remove old highlights that might be from a different AC which has been edited previously
				button.addEventListener('click', () => qsa(acInputs.join()).forEach(
					(input) => input.classList.remove(defaultHighlightClass)
				));
			}
		}), 100);
	}
}

onReactHydrated(document, buildUI);
