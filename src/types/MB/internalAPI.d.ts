namespace MB {
	type CoreEntity = {
		entityType: EntityType;
		/** MBID. */
		gid: MBID;
		name: string;
	};

	/** Entity object as returned by `/ws/js/entity/MBID`. */
	type InternalEntity = CoreEntity & {
		/** Internal (row) ID. */
		id: number;
		/** Disambiguation comment, can be empty. */
		comment: string;
		latest_annotation?: InternalAnnotation;
		editsPending: boolean;
		last_updated: DateTimeString;
	};

	/** Area object as returned by `/ws/js/entity/MBID`. */
	type InternalArea = InternalEntity & {
		entityType: 'area';
		country_code: string;
		primary_code: string;
		iso_3166_1_codes: string[];
		iso_3166_2_codes: string[];
		iso_3166_3_codes: string[];
		begin_date: Date | null;
		ended: boolean;
		end_date: Date | null;
		typeID: number | null;
	};

	/** Artist object as returned by `/ws/js/entity/MBID`. */
	type InternalArtist = InternalEntity & {
		entityType: 'artist';
		sort_name: string;
		typeID: number;
		gender_id: number;
		begin_date: Date | null;
		begin_area_id: number | null;
		ended: boolean;
		end_date: Date | null;
		end_area_id: number | null;
		area: null; // TODO: always null, maybe a bug?
		ipi_codes: []; // TODO: always empty, maybe a bug?
		isni_codes: []; // TODO: always empty, maybe a bug?
	};

	type InternalArtistCredit = {
		entityType: 'artist_credit';
		/** Numeric string. */
		id: string;
		editsPending: boolean;
		names: Array<{
			joinPhrase: string;
			name: string;
			artist: InternalArtist;
		}>;
	};

	/** Label object as returned by `/ws/js/entity/MBID`. */
	type InternalLabel = InternalEntity & {
		entityType: 'label';
		typeID: number;
		label_code: number;
		begin_date: Date | null;
		ended: boolean;
		end_date: Date | null;
		area: null; // TODO: always null, maybe a bug?
		ipi_codes: []; // TODO
		isni_codes: []; // TODO
	};

	/** Release object as returned by `/ws/js/entity/MBID`. */
	type InternalRelease = InternalEntity & {
		entityType: 'release';
		artist: string;
		artistCredit: InternalArtistCredit;
		releaseGroup: InternalReleaseGroup;
		mediums: GetterSetter<InternalMedium[]>;
		combined_format_name: string;
		combined_track_count: string; // numeric string
		/** Release length in ms. */
		length: number;
		barcode: string;
		events: Array<{
			country: InternalArea;
			date: Date;
		}>;
		labels: Array<{
			entityType: null;
			id: number;
			label: InternalLabel;
			label_id: number;
			catalogNumber: string | null;
		}>;
		language: InternalLanguage;
		languageID: number;
		script: InternalScript;
		scriptID: number;
		status: InternalReleaseStatus;
		statusID: number;
		packagingID: number;
		quality: number;
		related_artists: []; // TODO: always empty!?
		cover_art_presence: 'absent' | 'present';
		cover_art_url: null; // TODO: always null, also if above value is 'present'
		may_have_cover_art: boolean;
		may_have_discids: boolean;
		isProbablyClassical: boolean;
	};

	/** Release group object as returned by `/ws/js/entity/MBID`. */
	type InternalReleaseGroup = InternalEntity & {
		entityType: 'release_group';
		typeID: number;
		typeName: null; // TODO: always null?
		l_type_name: null; // TODO: always null?
		secondaryTypeIDs: number[];
		firstReleaseDate: DateString;
		hasCoverArt: boolean;
		release_count: number;
		review_count: number | null;
		// TODO: has no `artist` and `artistCredit` via `InternalRelease` 
	};

	/** Recording object as returned by `/ws/js/entity/MBID`. */
	type InternalRecording = InternalEntity & {
		entityType: 'recording';
		artist: string;
		artistCredit: InternalArtistCredit;
		/** Recording length in ms. */
		length: number;
		first_release_date: null; // TODO: always null!?
		isrcs: Array<{
			entityType: 'isrc';
			id: number;
			isrc: string;
			recording_id: number;
			editsPending: boolean;
		}>;
		related_works: []; // TODO: always empty!?
		video: boolean;
	};

	/** Work object as returned by `/ws/js/entity/MBID`. */
	type InternalWork = InternalEntity & {
		entityType: 'work';
		// TODO: incomplete
	};

	type InternalAnnotation = {
		id: number;
		text: string;
		html: string;
		creation_date: DateTimeString;
		editor: null; // TODO: always null because it is private?
		changelog: null; // TODO: string?
		parent: null; // TODO: previous annotation ID as number?
	};

	type InternalLanguage = {
		entityType: 'language';
		id: number;
		name: string;
		iso_code_1: string;
		iso_code_2b: string;
		iso_code_2b: string;
		iso_code_3: string;
		frequency: number;
	};

	type InternalMedium = {
		entityType: 'medium';
		id: number;
		name: string;
		format: InternalMediumFormat;
		formatID: number;
		position: number;
		positionName: string;
		release_id: number;
		tracks: InternalTrack[];
		track_count: number;
		cdtocs: []; // TODO
		editsPending: boolean;
	};

	type InternalMediumFormat = {
		entityType: 'medium_format';
		id: number;
		gid: MBID;
		name: string;
		description: string | null;
		has_discids: boolean;
		child_order: number;
		parent_id: number | null;
	};

	type InternalReleaseStatus = {
		entityType: 'release_status';
		id: number;
		gid: MBID;
		name: string;
		description: string;
		child_order: number;
		parent_id: null;
	};

	type InternalScript = {
		entityType: 'script';
		id: number;
		name: string;
		iso_code: string;
		iso_number: string; // numeric string
		frequency: number;
	};

	type InternalTrack = {
		entityType: 'recording';
		id: number;
		gid: MBID;
		name: string;
		artist: string;
		artistCredit: InternalArtistCredit;
		/** Track length in ms. */
		length: number;
		formattedLength: string;
		medium: null;
		number: string;
		position: number;
		recording: InternalRecording;
		isDataTrack: boolean;
		editsPending: boolean;
	};
}
