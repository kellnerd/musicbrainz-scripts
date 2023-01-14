// MusicBrainz::Server::Entity::Area::TO_JSON
declare type AreaT = Readonly<
  AnnotationRoleT &
    CommentRoleT &
    CoreEntityRoleT<'area'> &
    DatePeriodRoleT &
    TypeRoleT<AreaTypeT> & {
      readonly containment: ReadonlyArray<AreaT> | null;
      readonly country_code: string;
      readonly iso_3166_1_codes: ReadonlyArray<string>;
      readonly iso_3166_2_codes: ReadonlyArray<string>;
      readonly iso_3166_3_codes: ReadonlyArray<string>;
      readonly primary_code: string;
      readonly primaryAlias?: string | null;
    }
>;

declare type AreaTypeT = OptionTreeT<'area_type'>;
