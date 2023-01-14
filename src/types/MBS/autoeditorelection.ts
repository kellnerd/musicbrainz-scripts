// MusicBrainz::Server::Entity::AutoEditorElection::TO_JSON
declare type AutoEditorElectionT = EntityRoleT<never> & {
  readonly candidate: EditorT;
  readonly close_time?: string;
  readonly current_expiration_time: string;
  readonly is_closed: boolean;
  readonly is_open: boolean;
  readonly is_pending: boolean;
  readonly no_votes: number;
  readonly open_time?: string;
  readonly propose_time: string;
  readonly proposer: EditorT;
  readonly seconder_1?: EditorT;
  readonly seconder_2?: EditorT;
  readonly status_name: string;
  readonly status_name_short: string;
  readonly votes: ReadonlyArray<AutoEditorElectionVoteT>;
  readonly yes_votes: number;
};

// MusicBrainz::Server::Entity::AutoEditorElectionVote::TO_JSON
declare type AutoEditorElectionVoteT = EntityRoleT<never> & {
  readonly vote_name: string;
  readonly vote_time: string;
  readonly voter: EditorT;
};
