import type {
  PassThroughType,
  ComponentPassThroughClass,
} from "../../source/exports/PassThroughSupport.mjs";

import type {
  NumberStringType
} from "../NumberStringType.mjs";

export default class NSPT_THROW
               implements ComponentPassThroughClass<NumberStringType>
{
  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"]>,
    s: string, n: number
  ): string | PassThroughType<NumberStringType, NumberStringType["repeatForward"]>
  {
    void(s);
    void(n);
    throw new Error("repeatForward throw");
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"]>,
    n: number, s: string
  ): string | PassThroughType<NumberStringType, NumberStringType["repeatBack"]>
  {
    void(n);
    void(s);
    throw new Error("repeatBack throw");
  }
}
