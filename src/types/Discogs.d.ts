namespace Discogs {
	type Release = {
		id: number;
		title: string;
		artists: Artist[];
		/** Extra artists (credits). */
		extraartists: Artist[];
	};

	type Artist = {
		id: number;
		/** Main artist name. */
		name: string;
		/** Artist name variation (ANV), empty if no name variation is used. */
		anv: string;
		join: string;
		/** Role of the artist, may contain the role as credited in square brackets. */
		role: string;
		/** Role name as credited (custom extension for convenience). */
		roleCredit?: string;
		tracks: string;
		/** API URL of the artist. */
		resource_url: string;
	};
}
