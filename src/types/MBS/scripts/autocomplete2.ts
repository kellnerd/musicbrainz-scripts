// Adapted from https://github.com/metabrainz/musicbrainz-server/blob/f8166bf9e1dbe9d9d1663a06f90351331d9d6138/root/static/scripts/common/components/Autocomplete2/types.js

export type SearchableTypeT = EntityItemT['entityType'];

export type StateT<T extends EntityItemT> = {
  readonly canChangeType?: (arg0: string) => boolean;
  readonly containerClass?: string;
  readonly disabled?: boolean;
  readonly entityType: T['entityType'];
  readonly error: number;
  readonly highlightedIndex: number;
  readonly id: string;
  readonly indexedSearch: boolean;
  readonly inputChangeHook?: (
    inputValue: string,
    state: StateT<T>,
    selectItem: (arg0: OptionItemT<T>) => boolean,
  ) => boolean;
  readonly inputClass?: string;
  readonly inputValue: string;
  readonly isAddEntityDialogOpen?: boolean;
  readonly isInputFocused: boolean;
  readonly isLookupPerformed?: boolean;
  readonly isOpen: boolean;
  readonly items: ReadonlyArray<ItemT<T>>;
  readonly labelClass?: string;
  readonly labelStyle?: {};
  readonly page: number;
  readonly pendingSearch: string | null;
  readonly placeholder?: string;
  readonly recentItems: ReadonlyArray<OptionItemT<T>> | null;
  readonly recentItemsKey: string;
  readonly required: boolean;
  readonly results: ReadonlyArray<ItemT<T>> | null;
  readonly selectedItem: OptionItemT<T> | null;
  readonly showDescriptions?: boolean;
  readonly staticItems?: ReadonlyArray<OptionItemT<T>>;
  readonly statusMessage: string;
  readonly totalPages: number | null | undefined;
  readonly width?: string;
};

export type PropsT<T extends EntityItemT> = {
  readonly children?: React.ReactNode;
  readonly dispatch: (arg0: ActionT<T>) => void;
  readonly state: StateT<T>;
};

export type SearchActionT = {
  readonly indexed?: boolean;
  readonly searchTerm?: string;
  readonly type: 'search-after-timeout';
};

/* eslint-disable flowtype/sort-keys */
export type ActionT<T extends EntityItemT> = SearchActionT | {
  readonly type: 'change-entity-type';
  readonly entityType: SearchableTypeT;
} | {
  readonly type: 'clear-recent-items';
} | {
  readonly type: 'highlight-index';
  readonly index: number;
} | {
  readonly type: 'highlight-next-item';
} | {
  readonly type: 'highlight-previous-item';
} | {
  readonly type: 'reset-menu';
} | {
  readonly type: 'select-item';
  readonly item: ItemT<T>;
} | {
  readonly type: 'set-input-focus';
  readonly isFocused: boolean;
} | {
  readonly type: 'set-menu-visibility';
  readonly value: boolean;
} | {
  readonly type: 'show-ws-results';
  readonly entities: ReadonlyArray<T>;
  readonly page: number;
  readonly totalPages: number;
} | {
  readonly type: 'show-lookup-error';
} | {
  readonly type: 'show-lookup-type-error';
} | {
  readonly type: 'show-more-results';
} | {
  readonly type: 'set-recent-items';
  readonly items: ReadonlyArray<OptionItemT<T>>;
} | {
  readonly type: 'show-search-error';
} | {
  readonly type: 'stop-search';
} | {
  readonly type: 'toggle-add-entity-dialog';
  readonly isOpen: boolean;
} | {
  readonly type: 'toggle-indexed-search';
} | {
  readonly type: 'toggle-descriptions';
  readonly showDescriptions: boolean;
} | {
  readonly type: 'type-value';
  readonly value: string;
};

export type ActionItemT<T extends EntityItemT> = {
  readonly type: 'action';
  readonly action: ActionT<T>;
  readonly id: number | string;
  readonly name: string | (() => string);
  readonly level?: number;
  readonly separator?: boolean;
  readonly disabled?: boolean;
};

export type OptionItemT<T extends EntityItemT> = {
  readonly type: 'option';
  readonly id: number | string;
  readonly name: string | (() => string);
  readonly entity: T;
  readonly level?: number;
  readonly separator?: boolean;
  readonly disabled?: boolean;
};

export type HeaderItemT = {
  readonly type: 'header';
  readonly id: number | string;
  readonly name: string | (() => string);
  readonly disabled: true;
  readonly separator?: boolean;
};

export type ItemT<T extends EntityItemT> =
  | ActionItemT<T>
  | OptionItemT<T>
  | HeaderItemT;

/* eslint-enable flowtype/sort-keys */

/*
 * This is basically CoreEntityT without UrlT (since those aren't
 * searchable), plus EditorT (which isn't a core entity, but is
 * searchable).
 */
export type EntityItemT =
  | AreaT
  | ArtistT
  | EditorT
  | EventT
  | GenreT
  | InstrumentT
  | LabelT
  | LanguageT
  | LinkAttrTypeT
  | LinkTypeT
  | PlaceT
  | RecordingT
  | ReleaseGroupT
  | ReleaseT
  | SeriesT
  | WorkT;
