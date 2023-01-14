declare type SeriesEntityTypeT =
  | 'artist'
  | 'event'
  | 'recording'
  | 'release'
  | 'release_group'
  | 'work';

// MusicBrainz::Server::Entity::Series::TO_JSON
declare type SeriesT = Readonly<
  AnnotationRoleT &
    CommentRoleT &
    CoreEntityRoleT<'series'> &
    TypeRoleT<SeriesTypeT> & {
      readonly orderingTypeID: number;
      readonly primaryAlias?: string | null;
      readonly type?: SeriesTypeT;
    }
>;

declare type SeriesItemNumbersRoleT = {
  readonly seriesItemNumbers?: ReadonlyArray<string>;
};

declare type SeriesOrderingTypeT = OptionTreeT<'series_ordering_type'>;

declare type SeriesTypeT = Readonly<
  OptionTreeT<'series_type'> & {
    item_entity_type: SeriesEntityTypeT;
  }
>;
