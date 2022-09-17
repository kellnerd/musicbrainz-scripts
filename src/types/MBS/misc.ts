/*
 * See http://search.cpan.org/~lbrocard/Data-Page-2.02/lib/Data/Page.pm
 * Serialized in MusicBrainz::Server::TO_JSON.
 */
declare type PagerT = {
  readonly current_page: number;
  readonly entries_per_page: number;
  readonly first_page: 1;
  readonly last_page: number;
  readonly next_page: number | null;
  readonly previous_page: number | null;
  readonly total_entries: number;
};

declare type StrOrNum = string | number;
