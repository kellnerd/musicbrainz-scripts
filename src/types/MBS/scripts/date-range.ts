// Adapted from https://github.com/metabrainz/musicbrainz-server/blob/30aff7b53cf839aea88a18a57cb7c8e3a1fa98eb/root/static/scripts/edit/components/DateRangeFieldset.js (incomplete)

export type ActionT = {
  readonly type: 'update-begin-date';
  readonly action: PartialDateInputActionT;
} | {
  readonly type: 'update-end-date';
  readonly action: PartialDateInputActionT;
} | {
  readonly type: 'set-ended';
  readonly enabled: boolean;
} | {
  readonly type: 'copy-date';
};

// Adapted from https://github.com/metabrainz/musicbrainz-server/blob/28ec0278091c6fada78a62ad66054ba802574d99/root/static/scripts/edit/components/PartialDateInput.js (incomplete)

export type PartialDateInputActionT = {
  readonly type: 'set-date';
  readonly date: {
    readonly year?: string;
    readonly month?: string;
    readonly day?: string;
  };
} | {
  readonly type: 'show-pending-errors';
};
