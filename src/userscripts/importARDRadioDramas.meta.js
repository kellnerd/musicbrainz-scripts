/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Import ARD radio dramas',
	author: 'kellnerd',
	description: 'Imports German broadcast releases from the ARD Hörspieldatenbank radio drama database.',
	features: [
		'Adds an import button to the sidebar of detail pages (“Detailansicht”) on https://hoerspiele.dra.de',
		'Lets the user enter persistent name to MBID mappings for artists and labels',
		'Provides a button to copy voice actor credits to clipboard (can be pasted into the [credit parser](#voice-actor-credits))',
	],
	match: '*://hoerspiele.dra.de/detailansicht/*',
};

export default metadata;
