declare type ActiveEditorPreferencesT = {
  readonly datetime_format: string;
  readonly timezone: string;
};
/*
 * Only used in cases where the editor being sanitized is logged in;
 * exposes some preferences and misc. metadata.
 */

declare type ActiveEditorT = EntityRoleT<'editor'> & {
  readonly avatar: string;
  readonly has_confirmed_email_address: boolean;
  readonly name: string;
  readonly preferences: ActiveEditorPreferencesT;
  readonly privileges: number;
};

declare type EditorLanguageT = {
  readonly fluency: FluencyT;
  readonly language: LanguageT;
};

// MusicBrainz::Server::Entity::Editor::TO_JSON
declare type EditorT = EntityRoleT<'editor'> & {
  readonly avatar: string;
  readonly deleted: boolean;
  readonly is_limited: boolean;
  readonly name: string;
  readonly privileges: number;
};

declare type FluencyT = 'basic' | 'intermediate' | 'advanced' | 'native';

declare type UnsanitizedEditorPreferencesT = {
  readonly datetime_format: string;
  readonly email_on_no_vote: boolean;
  readonly email_on_notes: boolean;
  readonly email_on_vote: boolean;
  readonly public_ratings: boolean;
  readonly public_subscriptions: boolean;
  readonly public_tags: boolean;
  readonly subscribe_to_created_artists: boolean;
  readonly subscribe_to_created_labels: boolean;
  readonly subscribe_to_created_series: boolean;
  readonly subscriptions_email_period: string;
  readonly timezone: string;
};

// MusicBrainz::Server::unsanitized_editor_json
declare type UnsanitizedEditorT = Readonly<
  EntityRoleT<'editor'> & {
    readonly age: number | null;
    readonly area: AreaT | null;
    readonly avatar: string;
    readonly biography: string | null;
    readonly birth_date: PartialDateT | null;
    readonly deleted: boolean;
    readonly email: string | null;
    readonly email_confirmation_date: string | null;
    readonly gender: GenderT | null;
    readonly has_confirmed_email_address: boolean;
    readonly has_email_address: boolean;
    readonly is_charter: boolean;
    readonly is_limited: boolean;
    readonly languages: ReadonlyArray<EditorLanguageT> | null;
    readonly last_login_date: string | null;
    readonly name: string;
    readonly preferences: UnsanitizedEditorPreferencesT;
    readonly privileges: number;
    readonly registration_date: string;
    readonly website: string | null;
  }
>;
