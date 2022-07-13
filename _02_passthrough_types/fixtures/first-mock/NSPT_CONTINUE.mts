import type {
  PassThroughType,
  ComponentPassThroughClass,
} from "../../source/exports/PassThroughSupport.mjs";

import type {
  NumberStringType
} from "../NumberStringType.mjs";

export default class NSPT_CONTINUE
               implements ComponentPassThroughClass<NumberStringType>
{
  repeatForward(
    __previousResults__: PassThroughType<NumberStringType["repeatForward"]>,
    s: string, n: number
  ): PassThroughType<NumberStringType["repeatForward"]>
  {
    void(s);
    void(n);
    return __previousResults__;
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType["repeatBack"]>,
    n: number, s: string
  ): PassThroughType<NumberStringType["repeatBack"]>
  {
    void(n);
    void(s);
    return __previousResults__;
  }
}
