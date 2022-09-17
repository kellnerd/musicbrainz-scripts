// MusicBrainz::Server::Entity::Work::TO_JSON
declare type WorkT = Readonly<
  AnnotationRoleT &
    CommentRoleT &
    CoreEntityRoleT<'work'> &
    RatableRoleT &
    ReviewableRoleT &
    TypeRoleT<WorkTypeT> & {
      readonly _fromBatchCreateWorksDialog?: boolean;
      readonly artists: ReadonlyArray<ArtistCreditT>;
      readonly attributes: ReadonlyArray<WorkAttributeT>;
      readonly iswcs: ReadonlyArray<IswcT>;
      readonly languages: ReadonlyArray<WorkLanguageT>;
      readonly primaryAlias?: string | null;
      readonly related_artists?: {
        readonly artists: AppearancesT<string>;
        readonly writers: AppearancesT<string>;
      };
      readonly writers: ReadonlyArray<{
        readonly credit: string;
        readonly entity: ArtistT;
        readonly roles: ReadonlyArray<string>;
      }>;
    }
>;

declare type WorkTypeT = OptionTreeT<'work_type'>;

// MusicBrainz::Server::Entity::WorkLanguage::TO_JSON
declare type WorkLanguageT = {
  readonly language: LanguageT;
};
