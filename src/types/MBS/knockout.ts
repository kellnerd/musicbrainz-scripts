declare type KnockoutObservable<T> = {
  peek: () => T;
  subscribe: (
    arg0: (arg0: T) => void,
    target?: unknown,
    event?: string,
  ) => {
    dispose: () => never;
  };
};

declare type KnockoutObservableArray<T> = KnockoutObservable<
  ReadonlyArray<T>
> & {
  push: (arg0: T) => never;
  remove: (arg0: T) => never;
};
