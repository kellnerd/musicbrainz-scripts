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
		'series',
		'url',
		'work',
	] as const;

	type EntityType = typeof entityTypes[number];

	/** Format: `/[0-9a-f-]{36}/` (UUID) */
	type MBID = string;

	/** Format: `YYYY-MM-DDThh:mm:ssZ` */
	type DateString = string;

	type Date = {
		year: number | null;
		month: number | null;
		day: number | null;
	};

	type Entity = {
		entityType: EntityType;
		/** MBID. */
		gid: MBID;
		name: string;
	};

	/** Entity object as returned by `/ws/js/entity/MBID`. */
	type InternalEntity = Entity & {
		/** Internal (row) ID. */
		id: number;
		/** Disambiguation comment, can be empty. */
		comment: string;
		editsPending: boolean;
		last_updated: DateString;
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

	/** Release object as returned by `/ws/js/entity/MBID`. */
	type InternalRelease = InternalEntity & {
		entityType: 'release';
		// TODO: incomplete
	};

	namespace RE {
		type Relationship = {
			id: number;
			entityTypes: string; // e.g. "artist-release"
			original: RelationshipCore & { id: number };
			parent: BaseEditor;
			uniqueID: string;
			editsPending: false;
			// TODO: incomplete, there are more functions
		} & CreateGetterSetters<RelationshipCore>;

		type RelationshipCore = {
			attributes: Attribute[];
			begin_date: Date;
			end_date: Date;
			ended: boolean;
			entities: Entity[]; // should have two elements
			entity0_credit: string;
			entity1_credit: string;
			linkTypeID: number;
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
			checkedRecordings: function;
			checkedWorks: function;
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
			source: Target<InternalEntity>;
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
	function entity(data: Partial<InternalEntity>, type: Entity): RE.Target<Partial<InternalEntity>>;
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
