import type {
  PassThroughType,
  ComponentPassThroughClass,
} from "../../source/exports/PassThroughSupport.mjs";

import type {
  NumberStringType
} from "../NumberStringType.mjs";

import type {
  NumberStringTypeAndLog
} from "./NSPT_ENTRY.mjs";

export default class NSPT_LOG_ENTER
               implements ComponentPassThroughClass<NumberStringType, NumberStringTypeAndLog>
{
  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"], NumberStringTypeAndLog>,
    s: string, n: number
  ) : void
  {
    void(s);
    void(n);
    __previousResults__.entryPoint.log(true, "repeatForward");
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"], NumberStringTypeAndLog>,
    n: number, s: string
  ) : void
  {
    void(n);
    void(s);
    __previousResults__.entryPoint.log(true, "repeatBack");
  }
}
