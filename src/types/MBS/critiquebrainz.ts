declare type CritiqueBrainzUserT = {
  readonly id: string;
  readonly name: string;
};

declare type CritiqueBrainzReviewT = {
  readonly author: CritiqueBrainzUserT;
  readonly body: string;
  readonly created: string;
  readonly id: string;
  readonly rating: number | null;
};

declare type ReviewableT =
  | ArtistT
  | EventT
  | LabelT
  | PlaceT
  | RecordingT
  | ReleaseGroupT
  | WorkT;

declare type ReviewableRoleT = {
  readonly review_count?: number;
};
