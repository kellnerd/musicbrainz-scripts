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
import { $transformInputValues } from '../transformInputValues.js';

const annotationInput = [
	'textarea[name$=text]', // entity annotation
	'textarea[name$=description]', // collection description
	'textarea[name$=biography]', // user profile biography
].join();

$transformInputValues(annotationInput, markdownToAnnotation);

$(annotationInput).each(async (_index, input) => {
	input.disabled = true; // lock input, requests for the names of multiple entities may take a while
	let newValue = await convertEntityLinks(input.value);
	if (newValue != input.value) {
		$(input).val(newValue);
	}
	input.disabled = false;
});
