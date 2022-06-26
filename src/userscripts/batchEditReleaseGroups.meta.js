import { createMusicBrainzURLRule } from '../../tools/userscriptMetadata.js';

/** @type {UserscriptMetadata} */
const metadata = {
	name: 'MusicBrainz: Batch‐edit release groups',
	author: 'kellnerd',
	description: 'Batch‐edit selected release groups from artist’s overview pages.',
	include: [
		`artist/[0-9a-f-]{36}`,
	].map(createMusicBrainzURLRule),
};

export default metadata;
