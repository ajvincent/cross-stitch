import type {
  ComponentPassThroughMap,
} from "../source/PassThroughSupport.mjs";

import type {
  NumberStringType
} from "../fixtures/NumberStringType.mjs";

import {
  NST_CONTINUE,
  NST_RESULT,
  NST_THROW,
} from "../fixtures/first-mock/NST_INSTANCES.mjs";

import NumberString_EntryBase from "../fixtures/first-mock/NSPT_ENTRY.mjs";
import NumberStringType_Sequence from "../fixtures/first-mock/NSPT_SEQUENCE.mjs";

xit("DirectDriver mockup returns a sane value", () => {
  const NST_COMPONENT_MAP: ComponentPassThroughMap<NumberStringType> = new Map;
  NST_COMPONENT_MAP.set("continue", NST_CONTINUE);
  NST_COMPONENT_MAP.set("result", NST_RESULT);
  NST_COMPONENT_MAP.set("throw", NST_THROW);
  
  void(new NumberStringType_Sequence(
    "driver",
    ["continue", "result", "throw"],
    NST_COMPONENT_MAP,
  ));

  const TestClass = new NumberString_EntryBase("driver", NST_COMPONENT_MAP);
  expect(TestClass.repeatForward("foo", 3)).toBe("foofoofoo");
});
