import NumberStringClass_PassThroughNI from "./generated/PassThrough_NotImplemented.mjs";

import {
  getStitchNamespace
} from "../source/Decorators.mjs";
import {
  PassThroughArgumentType
} from "./generated/PassThroughClassType.mjs";

const stitch = getStitchNamespace(
  "_03_decorators_namespace/NumberStringType",
);

@stitch.enter
@stitch.componentKey("main")
@stitch.leave
export default class NumberStringMain extends NumberStringClass_PassThroughNI
{
  repeatForward(
    __passThrough__: PassThroughArgumentType<(s: string, n: number) => string>,
    s: string,
    n: number
  ) : void
  {
    return __passThrough__.setReturnValue(s.repeat(n));
  }

  repeatBack(
    __passThrough__: PassThroughArgumentType<(n: number, s: string) => string>,
    n: number,
    s: string
  ) : void
  {
    return __passThrough__.setReturnValue(s.repeat(n));
  }
}
