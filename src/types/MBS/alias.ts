// MusicBrainz::Server::Entity::Alias::TO_JSON
declare type AliasT = DatePeriodRoleT &
  EditableRoleT &
  EntityRoleT<'alias'> &
  TypeRoleT<AliasTypeT> & {
    readonly locale: string | null;
    readonly name: string;
    readonly primary_for_locale: boolean;
    readonly sort_name: string;
  };

declare type AliasTypeT = OptionTreeT<'alias_type'>;
