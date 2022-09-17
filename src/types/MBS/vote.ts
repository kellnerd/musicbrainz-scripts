/* eslint-disable no-multi-spaces */
declare type VoteOptionT =
  | -2 // None
  | -1 // Abstain
  | 0 // No
  | 1 // Yes
  | 2; // Approve
/* eslint-enable no-multi-spaces */

// MusicBrainz::Server::Entity::Vote::TO_JSON
declare type VoteT = {
  readonly editor_id: number;
  readonly superseded: boolean;
  readonly vote: VoteOptionT;
  readonly vote_time: string;
};
