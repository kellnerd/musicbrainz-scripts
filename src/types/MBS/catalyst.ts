// Most of these types are serialized in the MusicBrainz::Server package.
declare type CatalystActionT = {
  readonly name: string;
};

declare type CatalystContextT = {
  readonly action: CatalystActionT;
  readonly flash: {
    readonly message?: string;
  };
  readonly relative_uri: string;
  readonly req: CatalystRequestContextT;
  readonly session: CatalystSessionT | null;
  readonly sessionid: string | null;
  readonly stash: CatalystStashT;
  readonly user?: UnsanitizedEditorT;
};

declare type CatalystRequestContextT = {
  readonly body_params: Readonly<Record<string, string>>;
  readonly headers: Readonly<Record<string, string>>;
  readonly method: string;
  readonly query_params: Readonly<Record<string, string>>;
  readonly secure: boolean;
  readonly uri: string;
};

declare type CatalystSessionT = {
  readonly merger?: MergeQueueT;
  readonly tport?: number;
};

declare type CatalystStashT = {
  readonly alert?: string;
  readonly alert_mtime?: number | null;
  readonly can_delete?: boolean;
  readonly collaborative_collections?: ReadonlyArray<CollectionT>;
  readonly commons_image?: CommonsImageT | null;
  readonly containment?: Record<number, 1 | null | undefined>;
  readonly current_action_requires_auth?: boolean;
  readonly current_language: string;
  readonly current_language_html: string;
  readonly entity?: CoreEntityT;
  readonly genre_map?: Readonly<Record<string, GenreT>>;
  readonly globals_script_nonce?: string;
  readonly hide_merge_helper?: boolean;
  readonly jsonld_data?: {};
  readonly last_replication_date?: string;
  readonly makes_no_changes?: boolean;
  readonly more_tags?: boolean;
  readonly new_edit_notes?: boolean;
  readonly new_edit_notes_mtime?: number | null;
  readonly number_of_collections?: number;
  readonly number_of_revisions?: number;
  readonly own_collections?: ReadonlyArray<CollectionT>;
  readonly release_artwork?: ArtworkT;
  readonly release_artwork_count?: number;
  readonly release_cdtoc_count?: number;
  readonly server_languages?: ReadonlyArray<ServerLanguageT>;
  readonly source_entity?: CoreEntityT;
  readonly subscribed?: boolean;
  readonly to_merge?: ReadonlyArray<CoreEntityT>;
  readonly top_tags?: ReadonlyArray<AggregatedTagT>;
  readonly user_tags?: ReadonlyArray<UserTagT>;
};

// MusicBrainz::Server::MergeQueue::TO_JSON
declare type MergeQueueT = {
  readonly entities: ReadonlyArray<number>;
  readonly ready_to_merge: boolean;
  readonly type: CoreEntityTypeT;
};

// root/utility/sanitizedContext.mjs
declare type SanitizedCatalystSessionT = {
  readonly tport?: number;
};

declare type SanitizedCatalystContextT = {
  readonly action: {
    readonly name: string;
  };
  readonly relative_uri: string;
  readonly req: {
    readonly method: string;
    readonly uri: string;
  };
  readonly session: SanitizedCatalystSessionT | null;
  readonly stash: {
    readonly current_language: string;
    readonly genre_map?: Readonly<Record<string, GenreT>>;
    readonly server_languages?: ReadonlyArray<ServerLanguageT>;
    readonly source_entity?: CoreEntityT;
  };
  readonly user: ActiveEditorT | null;
};

declare type ServerLanguageT = {
  readonly id: number;
  readonly name: string;
  readonly native_language: string;
  readonly native_territory: string;
};
