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

/** @type {UserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Guess Unicode punctuation',
	author: 'kellnerd',
	description: 'Searches and replaces ASCII punctuation symbols for many input fields by their preferred Unicode counterparts. Provides “Guess punctuation” buttons for titles, names, disambiguation comments, annotations and edit notes on all entity edit and creation pages.',
	include: [
		`(${supportedEntities.join('|')})/create`,
		'release/add', // release has no `create` route
		`(${supportedEntities.join('|')})/[0-9a-f-]{36}/edit(_annotation)?`,
		String.raw`artist/[0-9a-f-]{36}/(add-alias|alias\/\d+\/edit)`,
		String.raw`artist/[0-9a-f-]{36}/credit/\d+/edit`,
	].map(createMusicBrainzURLRule),
};

export default metadata;
