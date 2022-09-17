// MusicBrainz::Server::Entity::Artist::TO_JSON
declare type ArtistT = Readonly<
  AnnotationRoleT &
    CommentRoleT &
    CoreEntityRoleT<'artist'> &
    DatePeriodRoleT &
    IpiCodesRoleT &
    IsniCodesRoleT &
    RatableRoleT &
    ReviewableRoleT &
    TypeRoleT<ArtistTypeT> & {
      readonly area: AreaT | null;
      readonly begin_area: AreaT | null;
      readonly end_area: AreaT | null;
      readonly gender: GenderT | null;
      readonly primaryAlias?: string | null;
      readonly sort_name: string;
    }
>;

declare type ArtistTypeT = OptionTreeT<'artist_type'>;

declare type GenderT = OptionTreeT<'gender'>;
