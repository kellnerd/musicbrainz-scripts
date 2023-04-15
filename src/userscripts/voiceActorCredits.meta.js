/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Voice actor credits',
	author: 'kellnerd',
	description: 'Parses voice actor credits from text and automates the process of creating release relationships for these. Also imports credits from Discogs.',
	features: [
		'Simplifies the addition of “spoken vocals” relationships (at release level) by providing a pre-filled dialogue in the relationship editor.',
		'Parses a list of voice actor credits from text and remembers name to MBID mappings.',
		'Imports voice actor credits from linked Discogs release pages.',
		'Automatically matches artists whose Discogs pages are linked to MB (unlinked artists can be selected from the already opened inline search).',
		'Allows seeding of the credit input (`credits`) and the edit note (`edit-note`) via custom query parameters, which are encoded into the hash of the URL (*Example*: `/edit-relationships#credits=Narrator+-+John+Doe&edit-note=Seeding+example`).',
	],
	grant: [
		'GM.getValue',
		'GM.setValue',
	],
	match: '*://*.musicbrainz.org/release/*/edit-relationships',
	'run-at': 'document-idle',
};

export default metadata;
