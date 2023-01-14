/** @type {EnhancedUserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Voice actor credits',
	author: 'kellnerd',
	description: 'Parses voice actor credits from text and automates the process of creating release relationships for these. Also imports credits from Discogs.',
	features: [
		'Simplifies the addition of “spoken vocals” relationships (at release level) by providing a pre-filled dialogue in the relationship editor.',
		'Parses a list of voice actor credits from text and remembers name to MBID mappings.',
		'Imports voice actor credits from linked Discogs release pages.',
		'Automatically matches artists whose Discogs pages are linked to MB (unlinked artists can be selected from the already opened inline search).',
	],
	grant: [
		'GM.getValue',
		'GM.setValue',
	],
	match: '*://*.musicbrainz.org/release/*/edit-relationships',
	'run-at': 'document-idle',
};

export default metadata;

