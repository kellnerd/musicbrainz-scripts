// MusicBrainz::Server::Entity::AggregatedTag::TO_JSON
declare type AggregatedTagT = {
  readonly count: number;
  readonly tag: TagT;
};

// MusicBrainz::Server::Entity::Tag::TO_JSON
declare type TagT = {
  readonly entityType: 'tag';
  readonly genre?: GenreT;
  readonly id: number | null;
  readonly name: string;
};

// MusicBrainz::Server::Entity::UserTag::TO_JSON
declare type UserTagT = {
  readonly count: number;
  readonly tag: TagT;
  readonly vote: 1 | 0 | -1;
};
