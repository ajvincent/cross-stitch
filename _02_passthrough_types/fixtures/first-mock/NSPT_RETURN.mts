import type {
  PassThroughType,
  ComponentPassThroughClass,
} from "../../source/exports/PassThroughSupport.mjs";

import type {
  NumberStringType
} from "../NumberStringType.mjs";

export default class NSPT_RETURN
               implements ComponentPassThroughClass<NumberStringType>
{
  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"]>,
    n: number, s: string
  ): string | PassThroughType<NumberStringType, NumberStringType["repeatBack"]>
  {
    void(__previousResults__);
    return s.repeat(n);
  }

  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"]>,
    s: string, n: number
  ): string | PassThroughType<NumberStringType, NumberStringType["repeatForward"]>
  {
    void(__previousResults__);
    return s.repeat(n);
  }
}
