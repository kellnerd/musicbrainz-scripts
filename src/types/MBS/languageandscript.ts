declare type LanguageT = {
  readonly entityType: 'language';
  readonly frequency: number;
  readonly id: number;
  readonly iso_code_1: string | null;
  readonly iso_code_2b: string | null;
  readonly iso_code_2t: string | null;
  readonly iso_code_3: string | null;
  readonly name: string;
};

declare type ScriptT = {
  readonly entityType: 'script';
  readonly frequency: number;
  readonly id: number;
  readonly iso_code: string;
  readonly iso_number: string | null;
  readonly name: string;
};
