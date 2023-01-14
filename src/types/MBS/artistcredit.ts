// MusicBrainz::Server::Entity::ArtistCreditName::TO_JSON
declare type ArtistCreditNameT = {
  readonly artist: ArtistT;
  readonly joinPhrase: string;
  readonly name: string;
};

// MusicBrainz::Server::Entity::Role::ArtistCredit::TO_JSON
declare type ArtistCreditRoleT = {
  readonly artist: string;
  readonly artistCredit: ArtistCreditT;
};

// MusicBrainz::Server::Entity::ArtistCredit::TO_JSON
declare type ArtistCreditT = {
  readonly editsPending?: boolean;
  readonly entityType?: 'artist_credit';
  readonly id?: number;
  readonly names: ReadonlyArray<ArtistCreditNameT>;
};
