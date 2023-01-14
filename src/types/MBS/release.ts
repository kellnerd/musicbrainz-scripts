declare type QualityT = -1 | 0 | 1 | 2;

declare type ReleaseEventT = {
  readonly country: AreaT | null;
  readonly date: PartialDateT | null;
};

declare type ReleaseLabelT = {
  readonly catalogNumber: string | null;
  readonly label: LabelT | null;
  readonly label_id: number;
};

declare type ReleasePackagingT = OptionTreeT<'release_packaging'>;

declare type ReleaseStatusT = OptionTreeT<'release_status'>;

// MusicBrainz::Server::Entity::Release::TO_JSON
declare type ReleaseT = Readonly<
  AnnotationRoleT &
    ArtistCreditRoleT &
    CommentRoleT &
    CoreEntityRoleT<'release'> & {
      readonly barcode: string | null;
      readonly combined_format_name?: string;
      readonly combined_track_count?: string;
      readonly cover_art_presence: 'absent' | 'present' | 'darkened' | null;
      readonly events?: ReadonlyArray<ReleaseEventT>;
      readonly labels?: ReadonlyArray<ReleaseLabelT>;
      readonly language: LanguageT | null;
      readonly languageID: number | null;
      readonly length?: number;
      readonly may_have_cover_art?: boolean;
      readonly may_have_discids?: boolean;
      readonly mediums?: ReadonlyArray<MediumT>;
      readonly packagingID: number | null;
      readonly primaryAlias?: string | null;
      readonly quality: QualityT;
      readonly releaseGroup?: ReleaseGroupT;
      readonly script: ScriptT | null;
      readonly scriptID: number | null;
      readonly status: ReleaseStatusT | null;
      readonly statusID: number | null;
    }
>;

declare type ReleaseWithMediumsT = Readonly<
  ReleaseT & {
    readonly mediums: ReadonlyArray<MediumWithRecordingsT>;
  }
>;
