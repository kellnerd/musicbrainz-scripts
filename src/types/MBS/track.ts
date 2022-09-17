// MusicBrainz::Server::Entity::Track::TO_JSON
declare type TrackT = Readonly<
  EntityRoleT<'track'> &
    LastUpdateRoleT & {
      readonly artist: string;
      readonly artistCredit: ArtistCreditT;
      readonly editsPending: boolean;
      readonly gid: string;
      readonly isDataTrack: boolean;
      readonly length: number;
      readonly medium: MediumT | null;
      readonly medium_id: number;
      readonly name: string;
      readonly number: string;
      readonly position: number;
      readonly recording?: RecordingT;
    }
>;

declare type TrackWithRecordingT = Readonly<
  TrackT & {
    readonly recording: RecordingT;
  }
>;
