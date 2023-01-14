declare type ConfirmFormT = FormT<{
  readonly cancel: ReadOnlyFieldT<string>;
  readonly edit_note: ReadOnlyFieldT<string>;
  readonly make_votable: ReadOnlyFieldT<boolean>;
  readonly submit: ReadOnlyFieldT<string>;
}>;

declare type MediumFieldT = CompoundFieldT<{
  readonly id: FieldT<number>;
  readonly name: FieldT<string>;
  readonly position: FieldT<number>;
  readonly release_id: FieldT<number>;
}>;

declare type MergeFormT = FormT<{
  readonly edit_note: FieldT<string>;
  readonly make_votable: FieldT<boolean>;
  readonly merging: RepeatableFieldT<FieldT<number>>;
  readonly rename: FieldT<boolean>;
  readonly target: FieldT<number>;
}>;

declare type MergeReleasesFormT = FormT<{
  readonly edit_note: FieldT<string>;
  readonly make_votable: FieldT<boolean>;
  readonly medium_positions: CompoundFieldT<{
    readonly map: CompoundFieldT<ReadonlyArray<MediumFieldT>>;
  }>;
  readonly merge_strategy: FieldT<StrOrNum>;
  readonly merging: RepeatableFieldT<FieldT<StrOrNum>>;
  readonly rename: FieldT<boolean>;
  readonly target: FieldT<StrOrNum>;
}>;

declare type SearchFormT = FormT<{
  readonly limit: ReadOnlyFieldT<number>;
  readonly method: ReadOnlyFieldT<'advanced' | 'direct' | 'indexed'>;
  readonly query: ReadOnlyFieldT<string>;
  readonly type: ReadOnlyFieldT<string>;
}>;

declare type SecureConfirmFormT = FormT<{
  readonly cancel: ReadOnlyFieldT<string>;
  readonly csrf_token: ReadOnlyFieldT<string>;
  readonly submit: ReadOnlyFieldT<string>;
}>;

declare type TagLookupFormT = FormT<
  {
    readonly artist: ReadOnlyFieldT<string>;
    readonly duration: ReadOnlyFieldT<string>;
    readonly filename: ReadOnlyFieldT<string>;
    readonly release: ReadOnlyFieldT<string>;
    readonly track: ReadOnlyFieldT<string>;
    readonly tracknum: ReadOnlyFieldT<string>;
  },
  'tag-lookup'
>;
