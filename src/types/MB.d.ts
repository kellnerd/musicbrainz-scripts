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

	/** Format: `YYYY-MM-DD` */
	type DateString = string;

	/** Format: `YYYY-MM-DDThh:mm:ssZ` */
	type DateTimeString = string;

	type Date = {
		year: number | null;
		month: number | null;
		day: number | null;
	};

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

	// API

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

	/** Two letter ISO country code */
	type CountryCode = string;

	namespace RE {
		type Relationship = {
			id: number;
			/** Should return two elements, the source and the target entity (order defined by link type). */
			entities: Getter<TargetEntity[]>;
			attributes: Getter<Attribute[]>;
			setAttributes: Setter<CoreAttribute[]>;
			entityTypes: string; // e.g. "artist-release"
			original?: CoreRelationship;
			parent: BaseEditor;
			uniqueID: string;
			editsPending: false;
			// TODO: incomplete, there are more functions
		} & CreateGetterSetters<Omit<CoreRelationship, 'id' | 'entities' | 'attributes'>>;

		type CoreRelationship = {
			id?: number;
			attributes: CoreAttribute[];
			begin_date: Date;
			end_date: Date;
			ended: boolean;
			/** Should have two elements, the source and the target entity (order defined by link type). */
			entities: CoreEntity[];
			entity0_credit: string;
			entity1_credit: string;
			linkTypeID: number;
		};

		type Attribute = {
			type: AttributeType;
			creditedAs?: Getter<string>;
			// TODO: incomplete, see CoreAttribute
		};

		type CoreAttribute = {
			type: AttributeType;
			credited_as: string;
			// TODO: incomplete, there are more optional attributes
		};

		type AttributeType = {
			gid: MBID;
			id: number;
			name: string;
			description: string;
			creditable: true;
			free_text: boolean;
			entityType: 'link_attribute_type';
			parent_id: number | null;
			child_order: 0;
			root: AttributeType;
			root_gid: MBID;
			root_id: number;
			children?: AttributeType[];
		};

		type Dialog = {
			$dialog: JQuery;
			accept: () => void;
			open: (event?: Event) => void;
			autocomplete: {
				$input: JQuery<HTMLInputElement>;
				search: () => void;
				// TODO: incomplete
			};
			originalRelationship?: Relationship;
			relationship: Getter<Relationship>;
			source: TargetEntity;
			targetType: Getter<EntityType>;
			viewModel: BaseEditor;
			changeOtherRelationshipCredits: {
				source: GetterSetter<boolean>;
				target: GetterSetter<boolean>;
			};
			/** Use together with `changeOtherRelationshipCredits`. */
			selectedRelationshipCredits: {
				// TODO: find valid values other than 'all'
				source: GetterSetter<string>;
				target: GetterSetter<string>;
			};
			// TODO: incomplete, there are more functions
		};

		// TODO: imprecise
		type Editor = {
			ReleaseViewModel: function;
			UI: UI;
			exportTypeInfo: function;
			fields: {
				Relationship: function;
				LinkAttribute: function;
			};
			prepareSubmission: function;
		};

		// TODO: imprecise
		type UI = {
			AddDialog: class;
			BatchCreateWorksDialog: class;
			BatchRelationshipDialog: class;
			EditDialog: class;
			checkedRecordings: Getter<TargetRecording[]>;
			checkedWorks: Getter<TargetWork[]>;
		};

		// TODO: imprecise
		type DialogOptions = {
			viewModel;
			source;
			target;
			relationship;
			backward;
		};

		type BaseEditor = {
			cache: Record<string, Relationship>;
			source: TargetEntity;
			uniqueID: string;
			// TODO: incomplete, there are more functions
		};

		type ReleaseEditor = BaseEditor & {
			source: Target<InternalRelease>;
			// TODO: incomplete, there are more functions, `checkboxes` only available for releases?
		};

		/** Entity which is used as source or target of relationships. */
		type Target<Data extends MinimalEntity> = Data & {
			name: string;
			relationships: Getter<Relationship[]>;
			relationshipElements: {}; // ?
			uniqueID: string;
		};
		type TargetEntity = Target<InternalEntity>;
		type TargetArtist = Target<InternalArtist>;
		type TargetRecording = Target<InternalRecording>;
		type TargetWork = Target<InternalWork>;

		type Minimal<T extends InternalEntity> = Partial<T> & {
			entityType: EntityType;
		};
		type MinimalEntity = Minimal<InternalEntity>;
		type MinimalArtist = Minimal<InternalArtist>;
	}
}


declare namespace MB {
	const relationshipEditor: RE.Editor;
	const sourceRelationshipEditor: RE.BaseEditor;
	const releaseRelationshipEditor: RE.ReleaseEditor;

	function entity(data: RE.MinimalEntity): RE.Target<RE.MinimalEntity>;
	function entity(data: Partial<InternalEntity>, type: EntityType): RE.Target<Partial<InternalEntity>>;
	function entity(data: Partial<InternalArtist>, type: 'artist'): RE.Target<Partial<InternalArtist>>;
}

// TODO: declarations below have no effect
declare namespace MB.relationshipEditor.UI {
	class Dialog {
		constructor(options: RE.DialogOptions);
	}
	class AddDialog {
		constructor(options: RE.DialogOptions);
	}
}
