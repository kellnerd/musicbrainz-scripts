/**
 * - Views the API response for the currently visited Discogs entity (in a new tab).
 */

import { extractEntityFromURL, buildApiURL } from '../discogs/entity.js';

const currentEntity = extractEntityFromURL(window.location.href);

if (currentEntity) {
	open(buildApiURL(...currentEntity));
}
