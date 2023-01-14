/** @type {EnhancedUserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Parse copyright notice',
	author: 'kellnerd',
	description: 'Parses copyright notices and automates the process of creating release and recording relationships for these.',
	features: [
		'Extracts all copyright and legal information from the given text.',
		'Automates the process of creating label-release (or artist-release) relationships for these credits.',
		'Also creates phonographic copyright relationships for all selected recordings.',
		'Detects artists who own the copyright of their own release and defaults to adding artist-release relationships for these credits.',
		'See the [wiki page](https://github.com/kellnerd/musicbrainz-scripts/wiki/Parse-Copyright-Notices) for more details.',
	],
	grant: [
		'GM.getValue',
		'GM.setValue',
	],
	match: '*://*.musicbrainz.org/release/*/edit-relationships',
	'run-at': 'document-idle',
};

export default metadata;
