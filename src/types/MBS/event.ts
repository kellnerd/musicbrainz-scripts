// MusicBrainz::Server::Entity::Event::TO_JSON
declare type EventT = Readonly<
  AnnotationRoleT &
    CommentRoleT &
    CoreEntityRoleT<'event'> &
    DatePeriodRoleT &
    RatableRoleT &
    ReviewableRoleT &
    TypeRoleT<EventTypeT> & {
      readonly areas: ReadonlyArray<{
        readonly credit: string;
        readonly entity: AreaT;
      }>;
      readonly cancelled: boolean;
      readonly performers: ReadonlyArray<{
        readonly credit: string;
        readonly entity: ArtistT;
        readonly roles: ReadonlyArray<string>;
      }>;
      readonly places: ReadonlyArray<{
        readonly credit: string;
        readonly entity: PlaceT;
      }>;
      readonly primaryAlias?: string | null;
      readonly related_entities?: {
        readonly areas: AppearancesT<string>;
        readonly performers: AppearancesT<string>;
        readonly places: AppearancesT<string>;
      };
      readonly related_series: ReadonlyArray<number>;
      readonly setlist?: string;
      readonly time: string;
    }
>;

declare type EventTypeT = OptionTreeT<'event_type'>;
