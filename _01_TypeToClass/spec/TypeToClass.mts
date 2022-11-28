import { NumberStringType } from "../fixtures/NumberStringType.mjs";
/*
import {
  IsTypedNST,
  NST_Keys,
  NumberStringAndIllegal,
  NumberStringAndType,
  NumberStringConditional,
  NumberStringExcludesBar,
  NumberStringFoo,
  UnionArgument,
  SymbolTypeKey,
  NumberStringAndSymbol,
} from "../fixtures/TypePatterns.mjs";
*/

import {
  getModuleDefaultClass,
  ModuleSourceDirectory,
} from "../../_00_shared_utilities/source/AsyncSpecModules.mjs";

describe("TypeToClass supports", () => {
  const moduleSource: ModuleSourceDirectory = {
    importMeta: import.meta,
    pathToDirectory: "../../spec-generated"
  };

  it("type alias to literal", async () => {
    const NSTC = await getModuleDefaultClass<NumberStringType>(moduleSource, "NumberStringTypeClass.mjs");
    expect(Reflect.ownKeys(NSTC.prototype)).toEqual([
      "constructor",
      "repeatForward",
      "repeatBack",
    ]);

    const instance = new NSTC;
    expect(
      () => instance.repeatForward("foo", 3)
    ).toThrowError("not yet implemented");

    expect(
      () => instance.repeatBack(3, "foo")
    ).toThrowError("not yet implemented");
  });
});
