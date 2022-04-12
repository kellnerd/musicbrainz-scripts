namespace MB.RE {
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
		backward: Getter<boolean>;
		changeDirection: () => void;
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
		viewModel: BaseEditor;
		source;
		target;
		relationship;
		backward: boolean;
	};

	type BaseEditor = {
		activeDialog: Getter<Dialog>;
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
