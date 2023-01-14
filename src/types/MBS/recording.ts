// MusicBrainz::Server::Entity::Recording::TO_JSON
declare type RecordingT = Readonly<
  AnnotationRoleT &
    CommentRoleT &
    CoreEntityRoleT<'recording'> &
    RatableRoleT &
    ReviewableRoleT & {
      readonly appearsOn?: AppearancesT<{
        gid: string;
        name: string;
      }>;
      readonly artist?: string;
      readonly artistCredit?: ArtistCreditT;
      readonly first_release_date?: PartialDateT;
      readonly isrcs: ReadonlyArray<IsrcT>;
      readonly length: number;
      readonly primaryAlias?: string | null;
      readonly related_works: ReadonlyArray<number>;
      readonly video: boolean;
    }
>;

declare type RecordingWithArtistCreditT = Readonly<
  RecordingT & {
    readonly artistCredit: ArtistCreditT;
  }
>;

declare type ReleaseGroupAppearancesT = {
  readonly hits: number;
  readonly results: ReadonlyArray<ReleaseGroupT>;
};

declare type ReleaseGroupAppearancesRoleT = {
  readonly releaseGroupAppearances?: Readonly<
    Record<number, ReleaseGroupAppearancesT>
  >;
};
