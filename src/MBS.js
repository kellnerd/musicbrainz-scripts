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