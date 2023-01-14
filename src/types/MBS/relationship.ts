declare type LinkAttrT = {
  readonly credited_as?: string;
  readonly text_value?: string;
  type:
    | {
        readonly gid: string;
      }
    | LinkAttrTypeT;
  readonly typeID: number;
  readonly typeName: string;
};

declare type LinkAttrTypeT = OptionTreeT<'link_attribute_type'> & {
  readonly children?: ReadonlyArray<LinkAttrTypeT>;
  readonly creditable: boolean;
  readonly free_text: boolean;
  readonly instrument_comment?: string;
  readonly instrument_type_id?: number;
  readonly instrument_type_name?: string;
  l_description?: string;
  l_name?: string;
  level?: number;
  readonly root_gid: string;
  readonly root_id: number;
};

declare type LinkTypeAttrTypeT = {
  readonly max: number | null;
  readonly min: number | null;
};

declare type LinkTypeT = OptionTreeT<'link_type'> & {
  readonly attributes: Readonly<Record<StrOrNum, LinkTypeAttrTypeT>>;
  readonly cardinality0: number;
  readonly cardinality1: number;
  readonly children?: ReadonlyArray<LinkTypeT>;
  readonly deprecated: boolean;
  readonly documentation: string | null;
  readonly examples: ReadonlyArray<{
    readonly name: string;
    readonly relationship: RelationshipT;
  }>;
  readonly has_dates: boolean;
  readonly id: number;
  /*
   * The l_* properties are not sent by the server, but cached client-
   * side by the relationship editor.
   */
  l_description?: string;
  l_link_phrase?: string;
  l_name?: string;
  l_reverse_link_phrase?: string;
  readonly link_phrase: string;
  readonly long_link_phrase: string;
  readonly orderable_direction: number;
  readonly reverse_link_phrase: string;
  readonly root_id: number | null;
  readonly type0: CoreEntityTypeT;
  readonly type1: CoreEntityTypeT;
};

declare type PagedLinkTypeGroupT = {
  readonly backward: boolean;
  readonly is_loaded: boolean;
  readonly limit: number;
  readonly link_type_id: number;
  readonly offset: number;
  readonly relationships: ReadonlyArray<RelationshipT>;
  readonly total_relationships: number;
};

declare type PagedTargetTypeGroupT = Readonly<
  Record<string, PagedLinkTypeGroupT>
>;

declare type RelationshipT = Readonly<
  DatePeriodRoleT &
    EditableRoleT & {
      readonly attributes: ReadonlyArray<LinkAttrT>;
      readonly backward: boolean;
      readonly entity0?: CoreEntityT | null | undefined;
      readonly entity0_credit: string;
      readonly entity0_id: number;
      readonly entity1?: CoreEntityT | null | undefined;
      readonly entity1_credit: string;
      readonly entity1_id: number;
      readonly id: number;
      readonly linkOrder: number;
      readonly linkTypeID: number;
      readonly source_id: number | null;
      readonly source_type: CoreEntityTypeT;
      readonly target: CoreEntityT;
      readonly target_type: CoreEntityTypeT;
      readonly verbosePhrase: string;
    }
>;

declare type SeededRelationshipT = Readonly<
    RelationshipT & {
        readonly entity0_id: number | null;
        readonly entity1_id: number | null;
        readonly id: null;
        readonly linkTypeID: number | null;
    }
>;
