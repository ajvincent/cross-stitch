import { NumberStringType } from "../fixtures/NumberStringType.mjs";
import {
  IsTypedNST,
  /*
  NST_Keys,
  */
  NumberStringAndIllegal,
  NumberStringAndType,
  /*
  NumberStringConditional,
  NumberStringExcludesBar,
  */
  NumberStringFoo,
  UnionArgument,
  /*
  SymbolTypeKey,
  NumberStringAndSymbol,
  */
} from "../fixtures/TypePatterns.mjs";

import {
  getModuleDefaultClass,
  ModuleSourceDirectory,
} from "../../_00_shared_utilities/source/AsyncSpecModules.mjs";

describe("TypeToClass supports", () => {
  const moduleSource: ModuleSourceDirectory = {
    importMeta: import.meta,
    pathToDirectory: "../../spec-generated"
  };

  /** @see {@link ../spec-build/targets/NumberStringType.mts#} */
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

  /** @see {@link ../spec-build/targets/NumberStringInterface.mts#} */
  it("interface split across two declarations", async () => {
    const NSTC = await getModuleDefaultClass<NumberStringType>(moduleSource, "NumberStringInterfaceClass.mjs");
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

  /** @see {@link ../spec-build/targets/IsTypedNST.mts#} */
  it(`properties of a type as "not implemented" getter`, async () => {
    const TypedClass = await getModuleDefaultClass<IsTypedNST>(moduleSource, "IsTypedNST.mjs");
    expect(Reflect.ownKeys(TypedClass.prototype)).toEqual([
      "constructor",
      "type",
    ]);

    const instance = new TypedClass;
    expect(
      () => instance.type
    ).toThrowError("not yet implemented");
  });

  /** @see {@link ../spec-build/targets/NumberStringWithTypeClass.mts#} */
  it(`multiple types on implementation`, async () => {
    const TypedClass = await getModuleDefaultClass<NumberStringAndType>(moduleSource, "NumberStringWithTypeClass.mjs");
    expect(Reflect.ownKeys(TypedClass.prototype)).toEqual([
      "constructor",
      "repeatForward",
      "repeatBack",
      "type",
    ]);

    const instance = new TypedClass;

    expect(
      () => instance.repeatForward("foo", 3)
    ).toThrowError("not yet implemented");

    expect(
      () => instance.repeatBack(3, "foo")
    ).toThrowError("not yet implemented");

    expect(
      () => instance.type
    ).toThrowError("not yet implemented");
  });

  /** @see {@link ../spec-build/targets/NumberStringPartial.mts#} */
  it("partial type implementation", async () => {
    const NSTC = await getModuleDefaultClass<
      Pick<NumberStringType, "repeatForward">
    >(moduleSource, "NumberStringPartial.mjs");

    expect(Reflect.ownKeys(NSTC.prototype)).toEqual([
      "constructor",
      "repeatForward",
    ]);

    const instance = new NSTC;
    expect(
      () => instance.repeatForward("foo", 3)
    ).toThrowError("not yet implemented");
  });

  /** @see {@link ../spec-build/targets/StringNumberType.mts#} */
  it("imported & re-exported type", async () => {
    const NSTC = await getModuleDefaultClass<NumberStringType>(moduleSource, "StringNumberTypeClass.mjs");
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

  /** @see {@link ../spec-build/targets/IsTypedNSTWithConstructor.mts#} */
  it(`properties of a type which the constructor defines`, async () => {
    const TypedClass = await getModuleDefaultClass<IsTypedNST>(moduleSource, "IsTypedNSTWithConstructor.mjs");
    expect(Reflect.ownKeys(TypedClass.prototype)).toEqual([
      "constructor",
    ]);

    const instance = new TypedClass;
    expect(Reflect.ownKeys(instance)).toEqual([
      "type"
    ]);
    expect(instance.type).toBe("foo");
  });

  /** @see {@link ../spec-build/targets/NumberStringAndType.mts#} */
  it(`intersection of a referenced type`, async () => {
    const TypedClass = await getModuleDefaultClass<NumberStringAndType>(moduleSource, "NumberStringAndTypeClass.mjs");
    expect(Reflect.ownKeys(TypedClass.prototype)).toEqual([
      "constructor",
      "repeatForward",
      "repeatBack",
      "type",
    ]);

    const instance = new TypedClass;

    expect(
      () => instance.repeatForward("foo", 3)
    ).toThrowError("not yet implemented");

    expect(
      () => instance.repeatBack(3, "foo")
    ).toThrowError("not yet implemented");

    expect(
      () => instance.type
    ).toThrowError("not yet implemented");
  });

  /** @see {@link ../spec-build/targets/FooExtendsNumberString.mts#} */
  it(`extended interfaces`, async () => {
    const TypedClass = await getModuleDefaultClass<NumberStringFoo>(moduleSource, "FooExtendsNumberString.mjs");
    expect(Reflect.ownKeys(TypedClass.prototype)).toEqual([
      "constructor",
      "repeatFoo",
      "repeatForward",
      "repeatBack",
    ]);

    const instance = new TypedClass;

    expect(
      () => instance.repeatForward("foo", 3)
    ).toThrowError("not yet implemented");

    expect(
      () => instance.repeatBack(3, "foo")
    ).toThrowError("not yet implemented");

    expect(
      () => instance.repeatFoo(3)
    ).toThrowError("not yet implemented");
  });

  /** @see {@link ../spec-build/targets/NumberStringAndIllegal.mts#} */
  it("never key in type", async () => {
    const NSTC = await getModuleDefaultClass<NumberStringAndIllegal>(moduleSource, "NumberStringAndIllegal.mjs");
    expect(Reflect.ownKeys(NSTC.prototype)).toEqual([
      "constructor",
      "repeatForward",
      "repeatBack",
      "illegal"
    ]);

    const instance = new NSTC;
    expect(
      () => instance.repeatForward("foo", 3)
    ).toThrowError("not yet implemented");

    expect(
      () => instance.repeatBack(3, "foo")
    ).toThrowError("not yet implemented");

    expect(
      () => instance.illegal
    ).toThrowError("not yet implemented");
  });

  /** @see {@link ../spec-build/targets/UnionArgument.mts#} */
  it("union in arguments of a method", async () => {
    const NSTC = await getModuleDefaultClass<UnionArgument>(moduleSource, "UnionArgumentClass.mjs");
    expect(Reflect.ownKeys(NSTC.prototype)).toEqual([
      "constructor",
      "doSomething"
    ]);

    const instance = new NSTC;
    expect(
      () => instance.doSomething("foo")
    ).toThrowError("not yet implemented");
  });
});
