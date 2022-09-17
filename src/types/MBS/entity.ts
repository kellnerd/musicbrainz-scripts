declare type AppearancesT<T> = {
  readonly hits: number;
  readonly results: ReadonlyArray<T>;
};

declare type CommentRoleT = {
  readonly comment: string;
};

declare type CoreEntityRoleT<T> = EntityRoleT<T> &
  LastUpdateRoleT & {
    readonly gid: string;
    readonly name: string;
    readonly paged_relationship_groups?: Readonly<
      Record<CoreEntityTypeT, PagedTargetTypeGroupT | void>
    >;
    readonly relationships?: ReadonlyArray<RelationshipT>;
  };

declare type CollectableCoreEntityT =
  | AreaT
  | ArtistT
  | EventT
  | InstrumentT
  | LabelT
  | PlaceT
  | RecordingT
  | ReleaseGroupT
  | ReleaseT
  | SeriesT
  | WorkT;

declare type NonUrlCoreEntityT = CollectableCoreEntityT | GenreT;

declare type CoreEntityT = NonUrlCoreEntityT | UrlT;

declare type NonUrlCoreEntityTypeT =
  | 'area'
  | 'artist'
  | 'event'
  | 'genre'
  | 'instrument'
  | 'label'
  | 'place'
  | 'recording'
  | 'release_group'
  | 'release'
  | 'series'
  | 'work';

declare type CoreEntityTypeT = NonUrlCoreEntityTypeT | 'url';

declare type DatePeriodRoleT = {
  readonly begin_date: PartialDateT | null;
  readonly end_date: PartialDateT | null;
  readonly ended: boolean;
};

declare type EditableRoleT = {
  readonly editsPending: boolean;
};

declare type EntityRoleT<T> = {
  readonly entityType: T;
  readonly id: number;
};

declare type LastUpdateRoleT = {
  readonly last_updated: string | null;
};

declare type MinimalCoreEntityT = {
  readonly entityType: CoreEntityTypeT;
  readonly gid: string;
};

declare type PartialDateT = {
  readonly day: number | null;
  readonly month: number | null;
  readonly year: number | null;
};

declare type TypeRoleT<T> = {
  readonly typeID: number | null;
  readonly typeName?: string;
};

declare type WikipediaExtractT = {
  readonly content: string;
  readonly url: string;
};
