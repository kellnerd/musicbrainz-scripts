declare type CDTocT = Readonly<
  EntityRoleT<'cdtoc'> & {
    readonly discid: string;
    readonly freedb_id: string;
    readonly leadout_offset: number;
    readonly length: number;
    readonly track_count: number;
    readonly track_details: ReadonlyArray<{
      readonly end_sectors: number;
      readonly end_time: number;
      readonly length_sectors: number;
      readonly length_time: number;
      readonly start_sectors: number;
      readonly start_time: number;
    }>;
    readonly track_offset: ReadonlyArray<number>;
  }
>;

declare type MediumCDTocT = Readonly<
  EntityRoleT<'medium_cdtoc'> & {
    readonly cdtoc: CDTocT;
    readonly editsPending: boolean;
  }
>;

declare type MediumFormatT = OptionTreeT<'medium_format'> & {
  readonly has_discids: boolean;
  readonly year: number | null | undefined;
};

// MusicBrainz::Server::Entity::Medium::TO_JSON
declare type MediumT = Readonly<
  EntityRoleT<'track'> &
    LastUpdateRoleT & {
      readonly cdtoc_tracks?: ReadonlyArray<TrackT>;
      readonly cdtocs: ReadonlyArray<string>;
      readonly editsPending: boolean;
      readonly format: MediumFormatT | null;
      readonly format_id: number;
      readonly name: string;
      readonly position: number;
      readonly release_id: number;
      readonly track_count: number | null;
      readonly tracks?: ReadonlyArray<TrackT>;
      readonly tracks_pager?: PagerT;
    }
>;

declare type MediumWithRecordingsT = Readonly<
  MediumT & {
    readonly tracks?: ReadonlyArray<TrackWithRecordingT>;
  }
>;
