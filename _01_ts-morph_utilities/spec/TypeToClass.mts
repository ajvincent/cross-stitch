//const specGeneratedDir = path.resolve(url.fileURLToPath(import.meta.url), "../../spec-generated");

import { NumberStringType } from "../fixtures/NumberStringType.mjs";

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
});
