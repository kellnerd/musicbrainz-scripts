declare type AnnotatedEntityT =
  | AreaT
  | ArtistT
  | EventT
  | GenreT
  | InstrumentT
  | LabelT
  | PlaceT
  | RecordingT
  | ReleaseGroupT
  | ReleaseT
  | SeriesT
  | WorkT;

declare type AnnotatedEntityTypeT = AnnotatedEntityT['entityType'];

// MusicBrainz::Server::Entity::Role::Annotation::TO_JSON
declare type AnnotationRoleT = {
  readonly latest_annotation?: AnnotationT;
};

// MusicBrainz::Server::Entity::Annotation::TO_JSON
declare type AnnotationT = {
  readonly changelog: string;
  readonly creation_date: string;
  readonly editor: EditorT | null;
  readonly html: string;
  readonly id: number;
  readonly parent: CoreEntityT | null;
  readonly text: string | null;
};
