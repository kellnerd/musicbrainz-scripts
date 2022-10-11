import { createMusicBrainzURLRule } from '../../tools/userscriptMetadata.js';

/** Userscript has been tested for the following entities, these are all except for `genre` and `url`. */
const supportedEntities = [
	'area',
	'artist',
	'event',
	'instrument',
	'label',
	'place',
	'recording',
	'release',
	'release-group',
	'series',
	'work',
];

/** @type {EnhancedUserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Guess Unicode punctuation',
	author: 'kellnerd',
	description: 'Searches and replaces ASCII punctuation symbols for many input fields by their preferred Unicode counterparts. Provides “Guess punctuation” buttons for titles, names, disambiguation comments, annotations and edit notes on all entity edit and creation pages.',
	features: [
		'Guesses Unicode punctuation based on context as the ASCII symbols are ambiguous.',
		'Highlights all updated input fields in order to allow the user to review the changes.',
		'Works for release/medium/track titles and release disambiguation comments (in the release editor).',
		'Also supports other entity names and disambiguation comments (on their respective edit and creation pages).',
		'Detects the selected language (in the release editor) and uses localized quotes.',
		'Experimental support for annotations and edit notes. Preserves apostrophe-based markup (bold, italic) and URLs.',
	],
	include: [
		`(${supportedEntities.join('|')})/create`,
		'release/add', // release has no `create` route
		`(${supportedEntities.join('|')})/[0-9a-f-]{36}/edit(_annotation)?`,
		String.raw`artist/[0-9a-f-]{36}/credit/\d+/edit`,
	].map(createMusicBrainzURLRule),
};

export default metadata;
