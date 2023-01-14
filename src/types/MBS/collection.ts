// MusicBrainz::Server::Entity::Collection::TO_JSON
declare type CollectionT = EntityRoleT<'collection'> &
  TypeRoleT<CollectionTypeT> & {
    readonly collaborators: ReadonlyArray<EditorT>;
    readonly description: string;
    readonly description_html: string;
    readonly editor: EditorT | null;
    readonly editor_is_limited: boolean;
    readonly entity_count: number;
    readonly gid: string;
    readonly item_entity_type?: CoreEntityTypeT;
    readonly name: string;
    readonly public: boolean;
    readonly subscribed?: boolean;
  };

declare type CollectionTypeT = OptionTreeT<'collection_type'> & {
  item_entity_type: string;
};
