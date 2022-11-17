// Adapted from https://github.com/metabrainz/musicbrainz-server/blob/01d046625c7751b05358e6d5225b55b57f327b6e/root/static/scripts/relationship-editor/types.js

import * as tree from 'weight-balanced-tree';

import type {
  OptionItemT as AutocompleteOptionItemT,
  StateT as AutocompleteStateT,
} from '../autocomplete2';
import type { LazyReleaseStateT } from '../release';

export type CreditChangeOptionT =
  | ''
  | 'all'
  | 'same-entity-types'
  | 'same-relationship-type';

export type RelationshipStateForTypesT<
  T0 extends CoreEntityT,
  T1 extends CoreEntityT
> = {
  readonly _original: RelationshipStateT | null;
  readonly _status: RelationshipEditStatusT;
  readonly attributes: tree.ImmutableTree<LinkAttrT> | null;
  readonly begin_date: PartialDateT | null;
  readonly editsPending: boolean;
  readonly end_date: PartialDateT | null;
  readonly ended: boolean;
  readonly entity0: T0;
  readonly entity0_credit: string;
  readonly entity1: T1;
  readonly entity1_credit: string;
  readonly id: number;
  readonly linkOrder: number;
  readonly linkTypeID: number | null;
};

export type RelationshipStateT =
  RelationshipStateForTypesT<CoreEntityT, CoreEntityT>;

export type RelationshipPhraseGroupT = {
  readonly relationships: tree.ImmutableTree<RelationshipStateT> | null;
  readonly textPhrase: string;
};

export type RelationshipLinkTypeGroupT = {
  readonly backward: boolean;
  readonly phraseGroups: tree.ImmutableTree<RelationshipPhraseGroupT> | null;
  // Null types are represented by 0.
  readonly typeId: number;
};

export type RelationshipLinkTypeGroupKeyT = {
  readonly backward: boolean;
  readonly typeId: number;
};

export type RelationshipLinkTypeGroupsT = tree.ImmutableTree<RelationshipLinkTypeGroupT> | null;

export type RelationshipTargetTypeGroupT = [
  CoreEntityTypeT,
  RelationshipLinkTypeGroupsT,
];

export type RelationshipTargetTypeGroupsT = tree.ImmutableTree<RelationshipTargetTypeGroupT> | null;

export type RelationshipSourceGroupT = [
  CoreEntityT,
  RelationshipTargetTypeGroupsT,
];

export type RelationshipSourceGroupsT = tree.ImmutableTree<RelationshipSourceGroupT> | null;

export type NonReleaseCoreEntityT =
  | AreaT
  | ArtistT
  | EventT
  | GenreT
  | InstrumentT
  | LabelT
  | PlaceT
  | RecordingT
  | ReleaseGroupT
  | SeriesT
  | UrlT
  | WorkT;

export type NonReleaseCoreEntityTypeT = NonReleaseCoreEntityT['entityType'];

export type RelationshipDialogLocationT = {
  readonly backward?: boolean | null | undefined;
  readonly batchSelection?: boolean | null | undefined;
  readonly linkTypeId?: number | null | undefined;
  readonly relationshipId?: number | null | undefined;
  readonly source: CoreEntityT;
  readonly targetType?: CoreEntityTypeT | null | undefined;
  readonly textPhrase?: string | null | undefined;
  readonly track?: TrackWithRecordingT | null | undefined;
};

export type RelationshipEditorStateT = {
  /*
   * Instead of storing dialog openness as local component state, we store a
   * `dialogLocation` in the top-level state.  This makes it easier to
   * control relationship dialogs from userscripts, since we only have to
   * expose the top-level dispatch function from here -- rather than many
   * individual "setState" callbacks which can be hard to identify.
   *
   * `dialogLocation` is threaded downstream throughout the component tree,
   * but only where applicable; it should be passed as null where not
   * applicable in order to not defeat component memoization and not trigger
   * a cascade of unnecessary updates across the entire page.
   */
  readonly dialogLocation: RelationshipDialogLocationT | null;
  readonly entity: NonReleaseCoreEntityT;
  // existing = relationships that exist in the database
  readonly existingRelationshipsBySource: RelationshipSourceGroupsT;
  readonly reducerError: Error | null;
  readonly relationshipsBySource: RelationshipSourceGroupsT;
};

export type SeededRelationshipT = Readonly<
  RelationshipT & {
    readonly entity0_id: number | null;
    readonly entity1_id: number | null;
    readonly id: null;
    readonly linkTypeID: number | null;
  }
>;

export type RelationshipDialogStateT = {
  readonly attributes: DialogAttributesStateT;
  readonly backward: boolean;
  readonly datePeriodField: DatePeriodFieldT;
  readonly linkOrder: number;
  readonly linkType: DialogLinkTypeStateT;
  readonly resultingDatePeriod: DatePeriodRoleT;
  readonly sourceEntity: DialogSourceEntityStateT;
  readonly targetEntity: DialogTargetEntityStateT;
};

export type DialogBooleanAttributeStateT = Readonly<
  DialogLinkAttributeStateT & {
    readonly control: 'checkbox';
    readonly enabled: boolean;
  }
>;

export type DialogMultiselectAttributeStateT = Readonly<
  DialogLinkAttributeStateT & {
    readonly control: 'multiselect';
    readonly linkType: LinkTypeT;
    readonly values: ReadonlyArray<DialogMultiselectAttributeValueStateT>;
  }
>;

export type DialogMultiselectAttributeValueStateT = {
  readonly autocomplete: AutocompleteStateT<LinkAttrTypeT>;
  readonly control: 'multiselect-value';
  readonly creditedAs?: string;
  readonly error?: string;
  readonly key: number;
  readonly removed: boolean;
};

export type DialogTextAttributeStateT = Readonly<
  DialogLinkAttributeStateT & {
    readonly control: 'text';
    readonly textValue: string;
  }
>;

export type DialogAttributeT =
  | DialogBooleanAttributeStateT
  | DialogMultiselectAttributeStateT
  | DialogTextAttributeStateT;

export type DialogAttributesT = ReadonlyArray<DialogAttributeT>;

export type DialogAttributesStateT = {
  readonly attributesList: DialogAttributesT;
  readonly resultingLinkAttributes: tree.ImmutableTree<LinkAttrT> | null;
};

export type DialogLinkAttributeStateT = {
  creditedAs?: string;
  error: string;
  key: number;
  max: number | null;
  min: number | null;
  textValue?: string;
  type: LinkAttrTypeT;
};

/*
 * Represents a LinkAttrT that may come from an external userscript.
 * The primary difference is that typeID/typeName are not required.
 */
export type ExternalLinkAttrT = {
  readonly credited_as?: string;
  readonly text_value?: string;
  readonly type: {
    readonly gid: string;
  };
};

export type DialogLinkTypeStateT = {
  readonly autocomplete: AutocompleteStateT<LinkTypeT>;
  readonly error: React.ReactNode;
};

export type DialogSourceEntityStateT = Readonly<
  DialogEntityCreditStateT & {
    readonly entityType: CoreEntityTypeT;
    readonly error: React.ReactNode;
  }
>;

export type TargetTypeOptionT = {
  readonly text: string;
  readonly value: CoreEntityTypeT;
};

export type TargetTypeOptionsT = ReadonlyArray<TargetTypeOptionT>;

export type DialogTargetEntityStateT = Readonly<
  DialogEntityCreditStateT & {
    readonly allowedTypes: TargetTypeOptionsT | null;
    readonly autocomplete: AutocompleteStateT<NonUrlCoreEntityT> | null;
    readonly error: string;
    readonly relationshipId: number;
    readonly target: CoreEntityT;
    readonly targetType: CoreEntityTypeT;
  }
>;

export type DialogEntityCreditStateT = {
  readonly creditedAs: string;
  readonly creditsToChange: CreditChangeOptionT;
};

export type LinkAttributeShapeT = {
  readonly credited_as?: string;
  readonly text_value?: string;
  readonly type: LinkAttrTypeT | null;
};

export type LinkAttributesByRootIdT = Map<number, Array<LinkAttributeShapeT>>;

export type BatchCreateWorksDialogStateT = {
  readonly attributes: DialogAttributesStateT;
  readonly languages: MultiselectLanguageStateT;
  readonly linkType: DialogLinkTypeStateT;
  readonly workType: number | null;
};

export type EditWorkDialogStateT = {
  readonly languages: MultiselectLanguageStateT;
  readonly name: string;
  readonly workType: number | null;
};

export type MultiselectLanguageValueStateT = {
  readonly autocomplete: AutocompleteStateT<LanguageT>;
  readonly key: number;
  readonly removed: boolean;
};

export type MultiselectLanguageStateT = {
  readonly max: number | null;
  readonly staticItems: ReadonlyArray<AutocompleteOptionItemT<LanguageT>>;
  readonly values: ReadonlyArray<MultiselectLanguageValueStateT>;
};

/*
 * Release relationship editor types
 */

export type ReleaseWithMediumsAndReleaseGroupT = Readonly<
  ReleaseWithMediumsT & {
    readonly releaseGroup: ReleaseGroupT;
  }
>;

// Associates a recording ID with all of the medium IDs it appears on.
export type RecordingMediumsT = Map<number, Array<MediumWithRecordingsT>>;

export type MediumWorkStateT = {
  readonly isSelected: boolean;
  readonly targetTypeGroups: RelationshipTargetTypeGroupsT;
  readonly work: WorkT;
};

export type MediumWorkStateTreeT = tree.ImmutableTree<MediumWorkStateT> | null;

export type MediumRecordingStateT = {
  readonly isSelected: boolean;
  readonly recording: RecordingT;
  readonly relatedWorks: MediumWorkStateTreeT;
  readonly targetTypeGroups: RelationshipTargetTypeGroupsT;
};

export type MediumRecordingStateTreeT = tree.ImmutableTree<MediumRecordingStateT> | null;

export type MediumStateTreeT = tree.ImmutableTree<
  [MediumWithRecordingsT, MediumRecordingStateTreeT]
> | null;

export type ReleaseRelationshipEditorStateT = LazyReleaseStateT &
  RelationshipEditorStateT & {
    readonly editNoteField: ReadOnlyFieldT<string>;
    readonly enterEditForm: ReadOnlyFormT<{
      readonly make_votable: ReadOnlyFieldT<boolean>;
    }>;
    readonly entity: ReleaseWithMediumsAndReleaseGroupT;
    readonly mediums: MediumStateTreeT;
    readonly mediumsByRecordingId: RecordingMediumsT;
    readonly selectedRecordings: tree.ImmutableTree<RecordingT> | null;
    readonly selectedWorks: tree.ImmutableTree<WorkT> | null;
    readonly submissionError: string | null | undefined;
    readonly submissionInProgress: boolean;
  };

export type RelationshipSourceGroupsContextT = {
  readonly existing: RelationshipSourceGroupsT;
  readonly pending: RelationshipSourceGroupsT;
};

// Adapted from https://github.com/metabrainz/musicbrainz-server/blob/88a1a97b0709233f1919a217fc33a7fa381a98dc/root/static/scripts/relationship-editor/constants.js
export type RelationshipEditStatusT = number;
