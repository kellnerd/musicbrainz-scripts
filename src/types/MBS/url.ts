// MusicBrainz::Server::Entity::URL::TO_JSON
declare type UrlT = CoreEntityRoleT<'url'> &
  EditableRoleT & {
    readonly decoded: string;
    readonly href_url: string;
    readonly pretty_name: string;
    readonly show_in_external_links?: boolean;
    readonly show_license_in_sidebar?: boolean;
    readonly sidebar_name?: string;
  };