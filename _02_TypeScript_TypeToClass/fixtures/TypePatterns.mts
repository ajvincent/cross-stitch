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
export type HasTypeAttribute = IsTypedNST;

// Second type for an integrated class
export type Bar = {
  repeatBar(n: number): string;
}

// Imported type re-exported (happens a lot)
export type StringNumberType = NumberStringType;

// Referenced type, intersection
export type NumberStringAndBar = NumberStringType & Bar;

// Referenced type, union
export type NumberStringOrBar = NumberStringType | Bar;

// Mapped type
export type NST_Keys = {
  [P in keyof NumberStringType]: P
}

// Built-in parameterized type
export type RepeatForwardType = Pick<NumberStringType, "repeatForward">;
