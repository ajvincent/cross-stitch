import StaticValidator from "../source/ProjectJSON.mjs";

describe("ProjectJSON: StaticValidator", () => {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawData: any;

  beforeEach(() => {
    rawData = {
      "keys": {

      },
      "classGenerator": {
        "sourceTypeLocation": "../fixtures/NumberStringType.mts",
        "sourceTypeAlias": "NumberStringType",
        "targetDirLocation": "../spec-generated",
        "baseClassName": "NumberStringClass",
        "entryTypeAlias": "NumberStringClass"
      }
    };
  });

  describe("accepts", () => {
    it("raw data with no keys and a classGenerator", async () => {
      expect(await StaticValidator(rawData)).toBeTruthy();
    });

    it("raw data with a component key and a class generator", async () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
      };
      expect(await StaticValidator(rawData)).toBeTruthy();
    });

    it("raw data with a component key, a start component and a class generator", async () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
      };
      rawData.startComponent = "foo";
      expect(await StaticValidator(rawData)).toBeTruthy();
    });
  });

  describe("throws for", () => {
    it("a missing set of keys", async () => {
      delete rawData.keys;
      expect(
        () => StaticValidator(rawData)
      ).toThrowError("data did not pass schema");
    });

    it("a missing classGenerator", async () => {
      delete rawData.classGenerator;
      expect(
        () => StaticValidator(rawData)
      ).toThrowError("data did not pass schema");
    });

    it("an extra property on the raw data", async () => {
      rawData.extra = true;
      expect(
        () => StaticValidator(rawData)
      ).toThrowError("data did not pass schema");
    });
  });
});
