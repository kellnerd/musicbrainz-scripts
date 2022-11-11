/**
 * - Detects and fills the image types and comment of all pending uploads using their filenames.
 * - Treats filename parts in parentheses as image comments.
 */

import { detectCoverArtTypesAndComment } from '../detectCoverArtTypes.js';

detectCoverArtTypesAndComment({
	commentPattern: /(?<=\().+?(?=\))/,
});
