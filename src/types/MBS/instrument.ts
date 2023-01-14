declare type InstrumentCreditsAndRelTypesRoleT = {
  readonly instrumentCreditsAndRelTypes?: Readonly<
    Record<string, ReadonlyArray<string>>
  >;
};

// MusicBrainz::Server::Entity::Instrument::TO_JSON
declare type InstrumentT = Readonly<
  AnnotationRoleT &
    CommentRoleT &
    CoreEntityRoleT<'instrument'> &
    TypeRoleT<InstrumentTypeT> & {
      readonly description: string;
      readonly primaryAlias?: string | null;
    }
>;

declare type InstrumentTypeT = OptionTreeT<'instrument_type'>;
