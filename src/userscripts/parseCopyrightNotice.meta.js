/** @type {UserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Parse copyright notice',
	author: 'kellnerd',
	description: 'Parses copyright notices and automates the process of creating release and recording relationships for these.',
	grant: [
		'GM.getValue',
		'GM.setValue',
	],
	match: '*://*.musicbrainz.org/release/*/edit-relationships',
	'run-at': 'document-idle',
};

export default metadata;
