/**
 * - Allows entity annotations to be (partly) written in basic Markdown and converts them into valid annotation markup.
 * - Shortens absolute URLs to MusicBrainz entities to `[entity-type:mbid|label]` links.
 * - Automatically fetches and uses the name of the linked entity as label if none was given.
 * - Also supports collection descriptions and user profile biographies.
 */

import {
	markdownToAnnotation,
	convertEntityLinks,
} from '../annotationConverter.js';
import { transform } from '@kellnerd/es-utils/string/transform.js';

const annotationInput = [
	'textarea[name$=text]', // entity annotation
	'textarea[name$=description]', // collection description
	'textarea[name$=biography]', // user profile biography
	'textarea#annotation', // release editor
].join();

document.querySelectorAll(annotationInput).forEach(async (/** @type {HTMLTextAreaElement} */ input) => {
	let value = input.value;
	if (!value) return;

	// Temporarily lock input, converting multiple entity links may take a while.
	input.disabled = true;

	value = transform(value, markdownToAnnotation);
	value = await convertEntityLinks(value);

	// Update inputs for changed value and trigger change event (for edit preview).
	if (value != input.value) {
		input.value = value;
		input.dispatchEvent(new Event('change'));
	}

	input.disabled = false;
});
