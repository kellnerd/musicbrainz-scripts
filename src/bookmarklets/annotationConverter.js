/**
 * - Allows entity annotations to be (partly) written in basic Markdown and converts them into valid annotation markup.
 * - Shortens absolute URLs to MusicBrainz entities to `[entity-type:mbid|label]` links.
 * - Automatically fetches and uses the name of the linked entity as label if none was given.
 */

import {
	markdownToAnnotation,
	convertEntityLinks,
} from '../annotationConverter';
import { transformInputValues } from '../transformInputValues';

const annotationInput = 'textarea[name$=text]';

transformInputValues(annotationInput, markdownToAnnotation);

$(annotationInput).each(async (_index, input) => {
	let newValue = await convertEntityLinks(input.value);
	if (newValue != input.value) {
		$(input).val(newValue);
	}
});
