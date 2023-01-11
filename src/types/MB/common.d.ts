namespace MB {
	const entityTypes = [
		'area',
		'artist',
		'event',
		'genre',
		'instrument',
		'label',
		'place',
		'release',
		'release_group',
		'recording',
		'series',
		'url',
		'work',
	] as const;

	type EntityType = typeof entityTypes[number];

	/** Format: `/[0-9a-f-]{36}/` (UUID) */
	type MBID = string;

	/** Two letter ISO country code */
	type CountryCode = string;

	/** Format: `YYYY-MM-DD` */
	type DateString = string;

	/** Format: `YYYY-MM-DDThh:mm:ssZ` */
	type DateTimeString = string;
}
