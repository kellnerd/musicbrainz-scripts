/** @type {UserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Voice actor credits',
	author: 'kellnerd',
	description: 'Parses voice actor credits from text and automates the process of creating release relationships for these. Also imports credits from Discogs.',
	grant: [
		'GM.getValue',
		'GM.setValue',
	],
	match: '*://*.musicbrainz.org/release/*/edit-relationships',
	'run-at': 'document-idle',
};

export default metadata;

