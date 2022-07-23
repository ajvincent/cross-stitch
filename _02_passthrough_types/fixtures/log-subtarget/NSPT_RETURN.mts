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
  ): string | PassThroughType<NumberStringType, NumberStringType["repeatBack"], NumberStringTypeAndLog>
  {
    __previousResults__.callTarget("logEnter");
    const rv = s.repeat(n);
    __previousResults__.callTarget("logLeave");
    return rv;
  }

  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"], NumberStringTypeAndLog>,
    s: string, n: number
  ): string | PassThroughType<NumberStringType, NumberStringType["repeatForward"], NumberStringTypeAndLog>
  {
    __previousResults__.callTarget("logEnter");
    const rv = s.repeat(n);
    __previousResults__.callTarget("logLeave");
    return rv;
  }
}
