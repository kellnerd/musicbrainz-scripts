// MusicBrainz::Server::Entity::Label::TO_JSON
declare type LabelT = Readonly<
  AnnotationRoleT &
    CommentRoleT &
    CoreEntityRoleT<'label'> &
    DatePeriodRoleT &
    IpiCodesRoleT &
    IsniCodesRoleT &
    RatableRoleT &
    ReviewableRoleT &
    TypeRoleT<LabelTypeT> & {
      readonly area: AreaT | null;
      readonly label_code: number;
      readonly primaryAlias?: string | null;
    }
>;

declare type LabelTypeT = OptionTreeT<'label_type'>;
