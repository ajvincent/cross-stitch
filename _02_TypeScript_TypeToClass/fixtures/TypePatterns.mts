// Imported type
import type { NumberStringType } from "./NumberStringType.mjs";

// extends
export interface NumberStringFoo extends NumberStringType
{
  repeatFoo(n: number) : string;
}

export type IsTypedNST = {
  type: string;
};

// Referenced type
export type Bar = {
  repeatBar(n: number): string;
}

// Referenced type re-exported (happens a lot)
export type StringNumberType = NumberStringType;

// Referenced type, intersection
export type NumberStringFooType = NumberStringType & Bar;

// Referenced type, union
export type NumberStringOrFoo = NumberStringType | Bar;

// Mapped type
export type NST_Keys = {
  [P in keyof NumberStringType]: P
}

// Built-in parameterized type
export type RepeatForwardType = Pick<NumberStringType, "repeatForward">;
