// MusicBrainz::Server::Entity::Artwork::TO_JSON
declare type ArtworkT = EditableRoleT & {
  readonly comment: string;
  readonly filename: string | null;
  readonly huge_ia_thumbnail: string;
  readonly huge_thumbnail: string;
  readonly id: number;
  readonly image: string | null;
  readonly large_ia_thumbnail: string;
  readonly large_thumbnail: string;
  readonly mime_type: string;
  readonly release?: ReleaseT;
  readonly small_ia_thumbnail: string;
  readonly small_thumbnail: string;
  readonly suffix: string;
  readonly types: ReadonlyArray<string>;
};

// MusicBrainz::Server::Entity::CommonsImage::TO_JSON
declare type CommonsImageT = {
  readonly page_url: string;
  readonly thumb_url: string;
};

declare type CoverArtTypeT = OptionTreeT<'cover_art_type'>;
