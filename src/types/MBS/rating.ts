// MusicBrainz::Server::Entity::Role::Rating::TO_JSON
declare type RatableRoleT = {
  readonly rating?: number;
  readonly rating_count?: number;
  readonly user_rating?: number;
};

declare type RatableT =
  | ArtistT
  | EventT
  | LabelT
  | PlaceT
  | RecordingT
  | ReleaseGroupT
  | WorkT;

// MusicBrainz::Server::Entity::Rating::TO_JSON
declare type RatingT = {
  readonly editor: EditorT;
  readonly rating: number;
};
