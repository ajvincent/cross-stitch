import type {
  PassThroughType,
  ComponentPassThroughClass,
} from "../../source/exports/PassThroughSupport.mjs";

import type {
  NumberStringType
} from "../NumberStringType.mjs";

export default class NSPT_CONTINUE
               implements ComponentPassThroughClass<NumberStringType, NumberStringType>
{
  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"], NumberStringType>,
    s: string, n: number
  ) : PassThroughType<NumberStringType, NumberStringType["repeatForward"], NumberStringType>
  {
    void(s);
    void(n);
    return __previousResults__;
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"], NumberStringType>,
    n: number, s: string
  ): PassThroughType<NumberStringType, NumberStringType["repeatBack"], NumberStringType>
  {
    void(n);
    void(s);
    return __previousResults__;
  }
}
