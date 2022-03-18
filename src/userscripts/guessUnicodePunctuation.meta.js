/** @type {UserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Guess Unicode punctuation',
	author: 'kellnerd',
	description: 'Searches and replaces ASCII punctuation symbols for many input fields by their preferred Unicode counterparts. Provides “Guess punctuation” buttons for titles, names, disambiguation comments, annotations and edit notes on all entity edit and creation pages.',
	match: [
		'*://*.musicbrainz.org/*/create',
		'*://*.musicbrainz.org/release/add',
		'*://*.musicbrainz.org/*/*/edit',
		'*://*.musicbrainz.org/*/*/edit_annotation',
	],
};

export default metadata;

