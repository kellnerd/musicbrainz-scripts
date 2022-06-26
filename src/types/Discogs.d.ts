namespace Discogs {
	const entityTypes = [
		'artist',
		'label',
		'master',
		'release',
	] as const;

	type EntityType = typeof entityTypes[number];

	type Release = {
		id: number;
		title: string;
		artists: Artist[];
		/** Extra artists (credits). */
		extraartists: Artist[];
	};

	/**
	 * Artist object as returned by the API:
	 * - `anv` is empty if no name variation is used.
	 * - `role` may contain a role credit in square brackets.
	 */
	type Artist = {
		id: number;
		/** Primary artist name (PAN). */
		name: string;
		/** Artist name variation (ANV). */
		anv: string;
		join: string;
		/** Role of the artist. */
		role: string;
		tracks: string;
		/** API URL of the artist. */
		resource_url: string;
	};
	
	/**
	 * Parsed artist object:
	 * - `anv` defaults to the main artist name.
	 * - `role` does not contain a role credit in square brackets.
	 */
	type ParsedArtist = Artist & {
		/** Role name as credited. */
		roleCredit?: string;
	};
}
