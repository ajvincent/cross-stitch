import type {
  PassThroughType,
  ComponentPassThroughClass,
} from "../../source/exports/PassThroughSupport.mjs";

import type {
  NumberStringType
} from "../NumberStringType.mjs";

export default class NSPT_THROW
               implements ComponentPassThroughClass<NumberStringType, NumberStringType>
{
  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"], NumberStringType>,
    s: string, n: number
  ) : void
  {
    void(__previousResults__);
    void(s);
    void(n);
    throw new Error("repeatForward throw");
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"], NumberStringType>,
    n: number, s: string
  ) : void
  {
    void(__previousResults__);
    void(n);
    void(s);
    throw new Error("repeatBack throw");
  }
}
