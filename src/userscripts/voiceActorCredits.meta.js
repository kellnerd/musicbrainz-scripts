/** @type {UserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Voice actor credits',
	author: 'kellnerd',
	description: 'Simplifies the addition of “spoken vocals” relationships (at release level). Provides additional buttons in the relationship editor to open a pre-filled dialogue or import the credits from Discogs.',
	match: '*://*.musicbrainz.org/release/*/edit-relationships',
	'run-at': 'document-idle',
};

export default metadata;

