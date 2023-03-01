// Adapted from https://github.com/metabrainz/musicbrainz-server/blob/b38f905d7c349bfb2c7e4661546500438694bea4/root/static/scripts/relationship-editor/types/actions.js

import * as tree from 'weight-balanced-tree';

import type {
  ActionT as AutocompleteActionT,
  EntityItemT as AutocompleteEntityItemT,
} from '../autocomplete2';
import type { ActionT as DateRangeFieldsetActionT } from '../date-range';
import type { LazyReleaseActionT } from '../release';
import type {
  CreditChangeOptionT,
  ExternalLinkAttrT,
  MediumRecordingStateTreeT,
  MediumWorkStateT,
  RelationshipDialogLocationT,
  RelationshipPhraseGroupT,
  RelationshipStateT,
} from './state';

export type DialogEntityCreditActionT = {
  readonly creditedAs: string;
  readonly type: 'set-credit';
} | {
  readonly type: 'set-credits-to-change';
  readonly value: CreditChangeOptionT;
};

export type DialogLinkOrderActionT = {
  readonly newLinkOrder: number;
  readonly type: 'update-link-order';
};

export type DialogActionT = {
  readonly type: 'change-direction';
} | {
  readonly attributes: ReadonlyArray<ExternalLinkAttrT>;
  readonly type: 'set-attributes';
} | {
  readonly type: 'toggle-attributes-help';
} | {
  readonly action: DialogEntityCreditActionT;
  readonly type: 'update-source-entity';
} | {
  readonly action: DialogTargetEntityActionT;
  readonly source: CoreEntityT;
  readonly type: 'update-target-entity';
} | {
  readonly source: CoreEntityT;
  readonly targetType: CoreEntityTypeT;
  readonly type: 'update-target-type';
} | {
  readonly action: DialogLinkTypeActionT;
  readonly source: CoreEntityT;
  readonly type: 'update-link-type';
} | {
  readonly action: DialogAttributeActionT;
  readonly type: 'update-attribute';
} | {
  readonly action: DateRangeFieldsetActionT;
  readonly type: 'update-date-period';
} | DialogLinkOrderActionT;

export type DialogAttributeActionT = {
  readonly action: DialogBooleanAttributeActionT;
  readonly rootKey: number;
  readonly type: 'update-boolean-attribute';
} | {
  readonly action: DialogMultiselectAttributeActionT;
  readonly rootKey: number;
  readonly type: 'update-multiselect-attribute';
} | {
  readonly action: DialogTextAttributeActionT;
  readonly rootKey: number;
  readonly type: 'update-text-attribute';
};

export type DialogBooleanAttributeActionT = {
  readonly enabled: boolean;
  readonly type: 'toggle';
};

export type DialogLinkTypeActionT = {
  readonly action: AutocompleteActionT<LinkTypeT>;
  readonly source: CoreEntityT;
  readonly type: 'update-autocomplete';
};

export type DialogMultiselectAttributeActionT =
  | MultiselectActionT<LinkAttrTypeT>
  | {
    readonly creditedAs: string;
    readonly type: 'set-value-credit';
    readonly valueKey: number;
  };

export type DialogTextAttributeActionT = {
  readonly textValue: string;
  readonly type: 'set-text-value';
};

export type UpdateRelationshipActionT = {
  readonly batchSelectionCount: number | void;
  readonly creditsToChangeForSource: CreditChangeOptionT;
  readonly creditsToChangeForTarget: CreditChangeOptionT;
  readonly newRelationshipState: RelationshipStateT;
  readonly oldRelationshipState: RelationshipStateT | null;
  readonly sourceEntity: CoreEntityT;
  readonly type: 'update-relationship-state';
};

export type RelationshipEditorActionT = {
  readonly relationship: RelationshipStateT;
  readonly type: 'remove-relationship';
} | {
  readonly relationship: RelationshipStateT;
  readonly source: CoreEntityT;
  readonly type: 'move-relationship-down';
} | {
  readonly relationship: RelationshipStateT;
  readonly source: CoreEntityT;
  readonly type: 'move-relationship-up';
} | {
  readonly hasOrdering: boolean;
  readonly linkPhraseGroup: RelationshipPhraseGroupT;
  readonly source: CoreEntityT;
  readonly type: 'toggle-ordering';
} | {
  readonly location: RelationshipDialogLocationT | null;
  readonly type: 'update-dialog-location';
} | {
  readonly changes: Readonly<Record<string, unknown>>;
  readonly entityType: CoreEntityTypeT;
  readonly type: 'update-entity';
} | UpdateRelationshipActionT;

export type UpdateTargetEntityAutocompleteActionT = {
  readonly action: AutocompleteActionT<NonUrlCoreEntityT>;
  readonly linkType: LinkTypeT | null | undefined;
  readonly source: CoreEntityT;
  readonly type: 'update-autocomplete';
};

export type DialogTargetEntityActionT =
  | UpdateTargetEntityAutocompleteActionT
  | {
    readonly action: DialogEntityCreditActionT;
    readonly type: 'update-credit';
  } | {
    readonly text: string;
    readonly type: 'update-url-text';
  };

/* Release relationship-editor actions */
export type BatchCreateWorksDialogActionT = {
  action: DialogAttributeActionT;
  type: 'update-attribute';
} | {
  action: MultiselectActionT<LanguageT>;
  type: 'update-languages';
} | {
  action: DialogLinkTypeActionT;
  source: CoreEntityT;
  type: 'update-link-type';
} | WorkTypeSelectActionT;

export type AcceptBatchCreateWorksDialogActionT = {
  readonly attributes: tree.ImmutableTree<LinkAttrT> | null;
  readonly languages: ReadonlyArray<LanguageT>;
  readonly linkType: LinkTypeT;
  readonly type: 'accept-batch-create-works-dialog';
  readonly workType: number | null;
};

export type ReleaseRelationshipEditorActionT =
  | LazyReleaseActionT
  | RelationshipEditorActionT
  | AcceptBatchCreateWorksDialogActionT
  | {
    readonly languages: ReadonlyArray<LanguageT>;
    readonly name: string;
    readonly type: 'accept-edit-work-dialog';
    readonly work: WorkT;
    readonly workType: number | null;
  } | {
    readonly relationships: ReadonlyArray<RelationshipT>;
    readonly type: 'load-work-relationships';
    readonly work: WorkT;
  } | {
    readonly recording: RecordingT;
    readonly type: 'remove-work';
    readonly workState: MediumWorkStateT;
  } | {
    readonly isSelected: boolean;
    readonly type: 'toggle-select-all-recordings';
  } | {
    readonly isSelected: boolean;
    readonly type: 'toggle-select-all-works';
  } | {
    readonly isSelected: boolean;
    readonly recording: RecordingT;
    readonly type: 'toggle-select-recording';
  } | {
    readonly isSelected: boolean;
    readonly type: 'toggle-select-work';
    readonly work: WorkT;
  } | {
    readonly isSelected: boolean;
    readonly recordingStates: MediumRecordingStateTreeT | null;
    readonly type: 'toggle-select-medium-recordings';
  } | {
    readonly isSelected: boolean;
    readonly recordingStates: MediumRecordingStateTreeT | null;
    readonly type: 'toggle-select-medium-works';
  } | {
    readonly editNote: string;
    readonly type: 'update-edit-note';
  } | {
    readonly checked: boolean;
    readonly type: 'update-make-votable';
  } | {
    type: 'start-submission';
  } | {
    readonly error?: string;
    type: 'stop-submission';
  } | {
    readonly edits:
    | Array<[Array<RelationshipStateT>, WsJsEditRelationshipT]>
    | Array<[Array<RelationshipStateT>, WsJsEditWorkCreateT]>;
    readonly responseData: WsJsEditResponseT;
    readonly type: 'update-submitted-relationships';
  };

// Adapted from https://github.com/metabrainz/musicbrainz-server/blob/88a1a97b0709233f1919a217fc33a7fa381a98dc/root/static/scripts/edit/components/Multiselect.js (incomplete)
export type MultiselectActionT<V extends AutocompleteEntityItemT> = {
  readonly type: 'add-value';
} | {
  readonly type: 'remove-value';
  readonly valueKey: number;
} | {
  readonly action: AutocompleteActionT<V>;
  readonly type: 'update-value-autocomplete';
  readonly valueKey: number;
};

// Adapted from https://github.com/metabrainz/musicbrainz-server/blob/88a1a97b0709233f1919a217fc33a7fa381a98dc/root/static/scripts/release/components/WorkTypeSelect.js
export type WorkTypeSelectActionT = {
  readonly type: 'update-work-type';
  readonly workType: number | null;
};
