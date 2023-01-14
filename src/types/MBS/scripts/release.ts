// Adapted from https://github.com/metabrainz/musicbrainz-server/blob/5872d9dc559049c8d0396e44f81b74384266521f/root/static/scripts/release/types.js

export type CreditsModeT = 'bottom' | 'inline';

export type LazyReleaseActionT = {
  readonly medium: MediumWithRecordingsT;
  readonly type: 'toggle-medium';
} | {
  readonly expanded: boolean;
  readonly mediums: ReadonlyArray<MediumWithRecordingsT>;
  readonly type: 'toggle-all-mediums';
} | {
  readonly medium: MediumWithRecordingsT;
  readonly tracks: ReadonlyArray<TrackWithRecordingT>;
  readonly type: 'load-tracks';
};

export type ActionT = LazyReleaseActionT | {
  readonly type: 'toggle-credits-mode';
};

export type PropsT = {
  readonly initialCreditsMode: CreditsModeT;
  readonly initialLinkedEntities: Readonly<Partial<LinkedEntitiesT>>;
  readonly noScript: boolean;
  readonly release: ReleaseWithMediumsT;
};

export type LoadedTracksMapT = ReadonlyMap<
  number,
  ReadonlyArray<TrackWithRecordingT>
>;

export type LazyReleaseStateT = {
  readonly expandedMediums: ReadonlyMap<number, boolean>;
  readonly loadedTracks: LoadedTracksMapT;
};

export type StateT = Readonly<
  LazyReleaseStateT & {
    readonly creditsMode: CreditsModeT;
  }
>;

// Adapted from https://github.com/metabrainz/musicbrainz-server/blob/88a1a97b0709233f1919a217fc33a7fa381a98dc/root/static/scripts/common/linkedEntities.mjs
export type LinkedEntitiesT = {
  area: Record<number, AreaT>;
  artist: Record<number, ArtistT>;
  artist_type: Record<number, ArtistTypeT>;
  edit: Record<number, EditWithIdT>;
  editor: Record<number, EditorT>;
  event: Record<number, EventT>;
  genre: Record<number, GenreT>;
  instrument: Record<number, InstrumentT>;
  label: Record<number, LabelT>;
  language: Record<number, LanguageT>;
  link_attribute_type: Record<StrOrNum, LinkAttrTypeT>;
  link_type: Record<StrOrNum, LinkTypeT>;
  link_type_tree: Record<string, Array<LinkTypeT>>;
  place: Record<number, PlaceT>;
  recording: Record<number, RecordingT>;
  release: Record<number, ReleaseT>;
  release_group: Record<number, ReleaseGroupT>;
  release_group_primary_type: Record<number, ReleaseGroupTypeT>;
  release_group_secondary_type: Record<number, ReleaseGroupSecondaryTypeT>;
  release_packaging: Record<number, ReleasePackagingT>;
  release_status: Record<number, ReleaseStatusT>;
  script: Record<number, ScriptT>;
  series: Record<number, SeriesT>;
  series_ordering_type: Record<number, SeriesOrderingTypeT>;
  series_type: Record<string, SeriesTypeT>;
  url: Record<number, UrlT>;
  work: Record<number, WorkT>;
  work_attribute_type: Record<number, WorkAttributeTypeT>;
  work_type: Record<string, WorkTypeT>;
};
