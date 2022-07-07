//const specGeneratedDir = path.resolve(url.fileURLToPath(import.meta.url), "../../spec-generated");

import { NumberStringType } from "../fixtures/NumberStringType.mjs";
import {
  IsTypedNST,
  NumberStringAndType,
  NumberStringFoo,
} from "../fixtures/TypePatterns.mjs";

describe("TypeToClass supports", () => {
  // Required because a completely resolved URI at build time doesn't exist.
  async function getModuleDefault<T extends unknown[], U>(leafName: string) : Promise<{
    new(__args__?: T) : U
  }>
  {
    return (await import("../spec-generated/" + leafName)).default;
  }

  it("type alias to literal", async () => {
    const NSTC = await getModuleDefault<[], NumberStringType>("NumberStringTypeClass.mjs");
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

  it("interface split across two declarations", async () => {
    const NSTC = await getModuleDefault<[], NumberStringType>("NumberStringInterfaceClass.mjs");
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

  it(`properties of a type as "not implemented" getter`, async () => {
    const TypedClass = await getModuleDefault<[], IsTypedNST>("IsTypedNST.mjs");
    expect(Reflect.ownKeys(TypedClass.prototype)).toEqual([
      "constructor",
      "type",
    ]);

    const instance = new TypedClass;
    expect(
      () => instance.type
    ).toThrowError("not yet implemented");
  });

  it(`multiple types on implementation`, async () => {
    const TypedClass = await getModuleDefault<[], NumberStringAndType>("NumberStringWithTypeClass.mjs");
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

  it("partial type implementation", async () => {
    const NSTC = await getModuleDefault<
      [], Pick<NumberStringType, "repeatForward">
    >("NumberStringPartial.mjs");

    expect(Reflect.ownKeys(NSTC.prototype)).toEqual([
      "constructor",
      "repeatForward",
    ]);

    const instance = new NSTC;
    expect(
      () => instance.repeatForward("foo", 3)
    ).toThrowError("not yet implemented");
  });

  it("imported & re-exported type", async () => {
    const NSTC = await getModuleDefault<[], NumberStringType>("StringNumberTypeClass.mjs");
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

  it(`properties of a type which the constructor defines`, async () => {
    const TypedClass = await getModuleDefault<[], IsTypedNST>("IsTypedNSTWithConstructor.mjs");
    expect(Reflect.ownKeys(TypedClass.prototype)).toEqual([
      "constructor",
    ]);

    const instance = new TypedClass;
    expect(Reflect.ownKeys(instance)).toEqual([
      "type"
    ]);
    expect(instance.type).toBe("foo");
  });

  it(`intersection of a referenced type`, async () => {
    const TypedClass = await getModuleDefault<[], NumberStringAndType>("NumberStringAndTypeClass.mjs");
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

  it(`extended interfaces`, async () => {
    const TypedClass = await getModuleDefault<[], NumberStringFoo>("FooExtendsNumberString.mjs");
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
});
