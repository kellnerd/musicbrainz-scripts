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
	edit_note: 'string | null',
	make_votable: 'number(boolean) | null',
};

/**
 * Maps edit data properties of release groups to the corresponding source data properties.
 */
export const RG_SOURCE_DATA = {
	name: 'name',
	// artist_credit: null,
	comment: 'comment',
	primary_type_id: 'typeID',
	secondary_type_ids: 'secondaryTypeIDs',
	// rel: null,
};
