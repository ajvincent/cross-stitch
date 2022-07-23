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

export default class NSPT_RETURN
               implements ComponentPassThroughClass<NumberStringType, NumberStringTypeAndLog>
{
  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"], NumberStringTypeAndLog>,
    n: number, s: string
  ): void
  {
    __previousResults__.callTarget("logEnter");
    __previousResults__.setReturnValue(s.repeat(n));
    __previousResults__.callTarget("logLeave");
  }

  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"], NumberStringTypeAndLog>,
    s: string, n: number
  ) : void
  {
    __previousResults__.callTarget("logEnter");
    __previousResults__.setReturnValue(s.repeat(n));
    __previousResults__.callTarget("logLeave");
  }
}
