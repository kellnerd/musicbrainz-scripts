type MaybeArray<T> = T | Array<T>;

type MaybePromise<T> = T | Promise<T>;

type Key = string | number;

/** Parameters for `String.replace()` (custom definition, `Parameters<String['replace']>` uses the wrong overload). */
type SubstitutionRule = [
	searchValue: string | RegExp,
	replaceValue: string | ((match: string, ...args: any[]) => string),
];

type FormDataRecord = Record<string, MaybeArray<string>>;

type KeyMapping<Source, Target> = Record<keyof Source, keyof Target>;
