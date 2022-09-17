// MusicBrainz::Server::Entity::CDStub::TO_JSON
declare type CDStubT = Readonly<
  EntityRoleT<'cdstub'> & {
    readonly artist: string;
    readonly barcode: string;
    readonly comment?: string;
    // null properties are not present in search indexes
    readonly date_added: string | null;
    readonly discid: string;
    readonly last_modified: string | null;
    readonly leadout_offset: number;
    readonly lookup_count: number | null;
    readonly modify_count: number | null;
    readonly title: string;
    readonly toc: string | null;
    readonly track_count: number;
    readonly track_offset: ReadonlyArray<number>;
    readonly tracks: ReadonlyArray<CDStubTrackT>;
  }
>;

declare type CDStubTrackT = Readonly<{
  readonly artist: string;
  readonly length: number;
  readonly sequence: number;
  readonly title: string;
}>;
