declare type IpiCodesRoleT = {
  readonly ipi_codes: ReadonlyArray<IpiCodeT>;
};

declare type IpiCodeT = EditableRoleT & {
  readonly ipi: string;
};

declare type IsniCodesRoleT = {
  readonly isni_codes: ReadonlyArray<IsniCodeT>;
};

declare type IsniCodeT = EditableRoleT & {
  readonly isni: string;
};

declare type IsrcT = EditableRoleT &
  EntityRoleT<'isrc'> & {
    readonly isrc: string;
    readonly recording_id: number;
  };

declare type IswcT = EditableRoleT &
  EntityRoleT<'iswc'> & {
    readonly iswc: string;
    readonly work_id: number;
  };
