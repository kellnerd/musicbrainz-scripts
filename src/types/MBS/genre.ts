// MusicBrainz::Server::Entity::Genre::TO_JSON
declare type GenreT = Readonly<
  AnnotationRoleT &
    CommentRoleT &
    CoreEntityRoleT<'genre'> & {
      readonly primaryAlias?: string | null;
    }
>;