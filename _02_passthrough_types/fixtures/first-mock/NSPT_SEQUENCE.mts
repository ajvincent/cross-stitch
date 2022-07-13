import {
  INVOKE_SYMBOL
} from "../../source/Common.mjs";

import type {
  PassThroughType,
  ReturnOrPassThroughType,
  ComponentPassThroughClass,
} from "../../source/PassThroughSupport.mjs";

import Sequence_Base from "../../source/Sequence_Base.mjs";

import type {
  NumberStringType
} from "../NumberStringType.mjs";

export default class NumberStringType_Sequence
               extends Sequence_Base<NumberStringType>
               implements ComponentPassThroughClass<NumberStringType>
{
  repeatBack(
    __previousResults__: PassThroughType<(n: number, s: string) => string>,
    n: number,
    s: string
  ): ReturnOrPassThroughType<NumberStringType["repeatBack"]>
  {
    void(n);
    void(s);
    return this[INVOKE_SYMBOL]<NumberStringType["repeatBack"]>(
      "repeatBack",
      __previousResults__
    );
  }

  repeatForward(
    __previousResults__: PassThroughType<NumberStringType["repeatForward"]>,
    s: string,
    n: number
  ): ReturnOrPassThroughType<NumberStringType["repeatForward"]>
  {
    void(s);
    void(n);
    return this[INVOKE_SYMBOL]<NumberStringType["repeatForward"]>(
      "repeatForward",
      __previousResults__
    );
  }
}
