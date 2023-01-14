/*
 * Types should be (mostly) kept in alphabetical order, though you may e.g.
 * keep Foo and WritableFoo or ReadOnlyFoo next to each other for clarity.
 */
declare type AreaFieldT = CompoundFieldT<{
  readonly gid: FieldT<string | null>;
  readonly name: FieldT<string>;
}>;

declare type CompoundFieldT<F> = {
  errors: Array<string>;
  field: F;
  has_errors: boolean;
  html_name: string;
  id: number;
  pendingErrors?: Array<string>;
  type: 'compound_field';
};

declare type ReadOnlyCompoundFieldT<F> = {
  readonly errors: ReadonlyArray<string>;
  readonly field: F;
  readonly has_errors: boolean;
  readonly html_name: string;
  readonly id: number;
  readonly pendingErrors?: ReadonlyArray<string>;
  readonly type: 'compound_field';
};

declare type DatePeriodFieldT = ReadOnlyCompoundFieldT<{
  readonly begin_date: PartialDateFieldT;
  readonly end_date: PartialDateFieldT;
  readonly ended: ReadOnlyFieldT<boolean>;
}>;

declare type WritableDatePeriodFieldT = CompoundFieldT<{
  readonly begin_date: WritablePartialDateFieldT;
  readonly end_date: WritablePartialDateFieldT;
  readonly ended: FieldT<boolean>;
}>;

declare type FieldT<V> = {
  errors: Array<string>;
  has_errors: boolean;
  html_name: string;

  /*
   * The field `id` is unique across all fields on the page. It's purpose
   * is for passing to `key` attributes on React elements.
   */
  id: number;
  pendingErrors?: Array<string>;
  type: 'field';
  value: V;
};

declare type ReadOnlyFieldT<V> = {
  readonly errors: ReadonlyArray<string>;
  readonly has_errors: boolean;
  readonly html_name: string;
  readonly id: number;
  readonly pendingErrors?: ReadonlyArray<string>;
  readonly type: 'field';
  readonly value: V;
};

// See lib/MusicBrainz/Server/Form/Role/ToJSON.pm
declare type FormT<F, N extends string = ''> = {
  field: F;
  has_errors: boolean;
  name: N;
  readonly type: 'form';
};

declare type ReadOnlyFormT<F, N extends string = ''> = {
  readonly field: F;
  readonly has_errors: boolean;
  readonly name: N;
  readonly type: 'form';
};
/*
 * See MusicBrainz::Server::Form::Utils::build_grouped_options
 * FIXME(michael): Figure out a way to consolidate GroupedOptionsT,
 * OptionListT, and OptionTreeT?
 */

declare type GroupedOptionsT = ReadonlyArray<{
  readonly optgroup: string;
  readonly options: SelectOptionsT;
}>;

declare type MaybeGroupedOptionsT =
  | {
      readonly grouped: true;
      readonly options: GroupedOptionsT;
    }
  | {
      readonly grouped: false;
      readonly options: SelectOptionsT;
    };

// See MB.forms.buildOptionsTree
declare type OptionListT = ReadonlyArray<{
  readonly text: string;
  readonly value: number;
}>;

declare type OptionTreeT<T> = EntityRoleT<T> & {
  readonly child_order: number;
  readonly description: string;
  readonly gid: string;
  readonly name: string;
  readonly parent_id: number | null;
};

declare type PartialDateFieldT = ReadOnlyCompoundFieldT<{
  readonly day: ReadOnlyFieldT<StrOrNum | null>;
  readonly month: ReadOnlyFieldT<StrOrNum | null>;
  readonly year: ReadOnlyFieldT<StrOrNum | null>;
}>;

declare type WritablePartialDateFieldT = CompoundFieldT<{
  readonly day: FieldT<StrOrNum | null>;
  readonly month: FieldT<StrOrNum | null>;
  readonly year: FieldT<StrOrNum | null>;
}>;

declare type RepeatableFieldT<F> = {
  errors: Array<string>;
  field: Array<F>;
  has_errors: boolean;
  html_name: string;
  id: number;
  last_index: number;
  pendingErrors?: Array<string>;
  type: 'repeatable_field';
};

declare type ReadOnlyRepeatableFieldT<F> = {
  readonly errors: ReadonlyArray<string>;
  readonly field: ReadonlyArray<F>;
  readonly has_errors: boolean;
  readonly html_name: string;
  readonly id: number;
  last_index: number;
  readonly pendingErrors?: ReadonlyArray<string>;
  readonly type: 'repeatable_field';
};
/*
 * See MusicBrainz::Server::Form::Utils::select_options.
 * FIXME(michael): Consolidate with OptionListT.
 */

declare type SelectOptionT = {
  readonly label: string | (() => string);
  readonly value: number | string;
};

declare type SelectOptionsT = ReadonlyArray<SelectOptionT>;
