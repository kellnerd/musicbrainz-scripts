// MusicBrainz::Server::Entity::Coordinates::TO_JSON
declare type CoordinatesT = {
  readonly latitude: number;
  readonly longitude: number;
};

// MusicBrainz::Server::Entity::Place::TO_JSON
declare type PlaceT = Readonly<
  AnnotationRoleT &
    CommentRoleT &
    CoreEntityRoleT<'place'> &
    DatePeriodRoleT &
    RatableRoleT &
    ReviewableRoleT &
    TypeRoleT<PlaceTypeT> & {
      readonly address: string;
      readonly area: AreaT | null;
      readonly coordinates: CoordinatesT | null;
      readonly primaryAlias?: string | null;
    }
>;

declare type PlaceTypeT = OptionTreeT<'place_type'>;
