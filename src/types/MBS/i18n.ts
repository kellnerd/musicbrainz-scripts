declare type AnchorProps = {
  readonly className?: string;
  readonly href: string;
  readonly key?: number | string;
  readonly rel?: 'noopener noreferrer';
  readonly target?: '_blank';
  readonly title?: string;
};

declare type Expand2ReactInput = VarSubstArg | AnchorProps;

declare type Expand2ReactOutput = string | React$MixedElement;

declare type ExpandLFunc<Input, Output> = (
  key: string,
  args: Readonly<Record<string, Input | Output>>,
) => Output;

declare type VarSubstArg = StrOrNum | React$MixedElement;
