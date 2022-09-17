declare type ReleaseGroupSecondaryTypeT = OptionTreeT<'release_group_secondary_type'>;

// MusicBrainz::Server::Entity::ReleaseGroup::TO_JSON
declare type ReleaseGroupT = Readonly<
  AnnotationRoleT &
    ArtistCreditRoleT &
    CommentRoleT &
    CoreEntityRoleT<'release_group'> &
    RatableRoleT &
    ReviewableRoleT &
    TypeRoleT<ReleaseGroupTypeT> & {
      readonly cover_art?: ArtworkT;
      readonly firstReleaseDate: string | null;
      readonly hasCoverArt: boolean;
      readonly l_type_name: string | null;
      readonly primaryAlias?: string | null;
      readonly release_count: number;
      readonly release_group?: ReleaseGroupT;
      readonly secondaryTypeIDs: ReadonlyArray<number>;
      readonly typeID: number | null;
      readonly typeName: string | null;
    }
>;

declare type ReleaseGroupTypeT = OptionTreeT<'release_group_type'> & {
  readonly historic: false;
};

declare type ReleaseGroupHistoricTypeT = {
  readonly historic: true;
  readonly id: number;
  readonly name: string;
};
