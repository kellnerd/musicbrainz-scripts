type Getter<T> = () => T;

type Setter<T> = (value: T) => void;

type GetterSetter<T> = (value: T) => T;

/** Recursively maps the properties of T to a combined getter and setter function with the same name. */
type CreateGetterSetters<Record> = {
	[Key in keyof Record]: // iterate over keys
	Record[Key] extends object ?
	Record[Key] extends any[] ?
	GetterSetter<Record[Key]> : // array types
	CreateGetterSetters<Record[Key]> : // record types (object, but not array)
	GetterSetter<Record[Key]>; // primitive types
};