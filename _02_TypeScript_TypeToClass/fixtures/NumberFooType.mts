import type { NumberStringType } from "./NumberStringType.mjs";

export interface NumberStringFoo extends NumberStringType
{
  repeatFoo(n: number) : string;
}
