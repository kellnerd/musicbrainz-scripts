declare type CompT<T> = {
  readonly new: T;
  readonly old: T;
};

// From Algorithm::Diff
declare type DiffChangeTypeT = '+' | '-' | 'c' | 'u';

declare type EditExpireActionT = 1 | 2;

declare type EditStatusT =
  | 1 // OPEN
  | 2 // APPLIED
  | 3 // FAILEDVOTE
  | 4 // FAILEDDEP
  | 5 // ERROR
  | 6 // FAILEDPREREQ
  | 7 // NOVOTES
  | 9; // DELETED

declare type EditT = CurrentEditT | HistoricEditT;

declare type EditWithIdT = Readonly<
  EditT & {
    readonly id: number;
  }
>;

// MusicBrainz::Server::Entity::EditNote::TO_JSON
declare type EditNoteT = {
  readonly edit_id: number;
  readonly editor: EditorT | null;
  readonly editor_id: number;
  readonly formatted_text: string;
  readonly post_time: string | null;
};

// Reused by all other edit types
declare type GenericEditT = {
  readonly auto_edit: boolean;
  readonly close_time: string;
  readonly conditions: {
    readonly auto_edit: boolean;
    readonly duration: number;
    readonly expire_action: EditExpireActionT;
    readonly votes: number;
  };
  readonly created_time: string;
  readonly data: Readonly<Record<string, any>>;
  readonly edit_kind: 'add' | 'edit' | 'remove' | 'merge' | 'other';
  readonly edit_name: string;
  readonly edit_notes: ReadonlyArray<EditNoteT>;
  readonly edit_type: number;
  readonly editor_id: number;
  readonly expires_time: string;
  readonly historic_type: number | null;
  readonly id: number | null;
  // id is missing in previews
  readonly is_loaded: boolean;
  readonly is_open: boolean;
  readonly preview?: boolean;
  readonly quality: QualityT;
  readonly status: EditStatusT;
  readonly votes: ReadonlyArray<VoteT>;
};

declare type GenericEditWithIdT = Readonly<
  GenericEditT & {
    readonly id: number;
  }
>;
