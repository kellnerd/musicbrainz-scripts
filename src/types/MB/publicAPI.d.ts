namespace MB {
	type Entity = {
		id: MBID;
		name: string;
		'sort-name': string;
		disambiguation: string;
		type: string | null;
		'type-id': MBID;
	}

	/** Artist object as returned by `/ws/2/artist/MBID`. */
	type Artist = Entity & {
		type: ArtistType;
		gender: Gender;
		'gender-id': MBID;
		area: Area | null;
		country: CountryCode;
		'begin-area': Area | null;
		'end-area': Area | null;
		'life-span': {
			begin: DateString | null;
			end: DateString | null;
			ended: boolean;
		};
		aliases: ArtistAlias[];
		ipis: string[];
		isnis: string[];
	};

	type Area = Entity & {
		'iso-3166-1-codes'?: string[]; // for countries
		'iso-3166-2-codes'?: string[]; // for subdivisions
	}

	type ArtistAlias = {
		name: string;
		'sort-name': string;
		type: 'Artist Name' | 'Legal name' | 'Search hint' | null;
		'type-id': MBID;
		locale: string;
		primary: boolean | null;
		begin: DateString | null;
		end: DateString | null;
		ended: boolean;
	};

	type ArtistType = 'Person' | 'Group' | 'Choir' | 'Orchestra' | 'Other' | null;

	type Gender = 'Male' | 'Female' | 'Other' | 'Not applicable' | null;
}
