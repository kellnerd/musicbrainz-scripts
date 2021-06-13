export const MBID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

/**
 * Dictionary of supported edit data properties for release groups.
 * Contains their types or mappings of their possible named values to internal IDs.
 */
export const RG_EDIT_FIELDS = {
	name: 'string',
	artist_credit: 'object',
	comment: 'string | null',
	primary_type_id: {
		'Album': 1,
		'Single': 2,
		'EP': 3,
		'Broadcast': 12,
		'Other': 11,
	},
	secondary_type_ids: {
		'Audio drama': 11,
		'Audiobook': 5,
		'Compilation': 1,
		'Demo': 10,
		'DJ-mix': 8,
		'Interview': 4,
		'Live': 6,
		'Mixtape/Street': 9,
		'Remix': 7,
		'Soundtrack': 2,
		'Spokenword': 3,
	},
	rel: 'array',
	url: 'array',
	edit_note: 'string | null',
	make_votable: 'number(boolean) | null',
};

/**
 * Maps edit data properties of release groups to the corresponding source data properties.
 */
export const RG_SOURCE_DATA = {
	name: 'name',
	// artist_credit: separate parser
	comment: 'comment',
	primary_type_id: 'typeID',
	secondary_type_ids: 'secondaryTypeIDs',
	// rel: separate parser
	// url: separate parser (same as for rel)
};

/**
 * Contains all relevant edit data properties of attributes (which are named the same as the corresponding source data properties).
 */
export const ATTRIBUTE_DATA = [
	'type', // contains a `gid` property (MBID of the attribute)
	'typeName', // redundant (ignored by MBS), just for convenience (TODO: replace by a UI "translation")
	'text_value', // only exists if "free_text" is true
	'credited_as', // only exists if "creditable" is true (used for instrument/vocal type credits)
];
