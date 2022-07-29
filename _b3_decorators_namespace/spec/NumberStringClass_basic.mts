import type { NumberStringType } from "../fixtures/NumberStringType.mjs";
import type {
  Entry_BaseType
} from "../../_02_passthrough_types/source/exports/Common.mjs";

describe("Decorators: Basic support, ", () => {
  // Required because a completely resolved URI at build time doesn't exist.
  async function getModuleDefault<U>(leafName: string) : Promise<{
    new() : U
  }>
  {
    return (await import("../fixtures/generated/" + leafName)).default;
  }

  let EntryClass: new () => NumberStringType;
  let entry: NumberStringType;

  beforeAll(async () => {
    EntryClass = await getModuleDefault<
      Entry_BaseType<NumberStringType>
    >("EntryClass.mjs");
  });

  beforeEach(() => {
    entry = new EntryClass;
  });

  it("repeatForward works", () => {
    expect(entry.repeatForward("foo", 3)).toBe("foofoofoo");
  });

  it("repeatBack works", () => {
    expect(entry.repeatBack(3, "foo")).toBe("foofoofoo");
  });
});
