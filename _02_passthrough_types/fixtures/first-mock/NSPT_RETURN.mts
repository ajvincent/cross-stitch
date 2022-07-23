import type {
  PassThroughType,
  ComponentPassThroughClass,
} from "../../source/exports/PassThroughSupport.mjs";

import type {
  NumberStringType
} from "../NumberStringType.mjs";

export default class NSPT_RETURN
               implements ComponentPassThroughClass<NumberStringType, NumberStringType>
{
  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"], NumberStringType>,
    n: number, s: string
  ) : void
  {
    return __previousResults__.setReturnValue(s.repeat(n));
  }

  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"], NumberStringType>,
    s: string, n: number
  ) : void
  {
    return __previousResults__.setReturnValue(s.repeat(n));
  }
}
