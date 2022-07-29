import { StaticValidator } from "../source/ProjectJSON.mjs";

describe("ProjectJSON: StaticValidator", () => {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawData: any;

  beforeEach(() => {
    rawData = {
      "schemaDate": 20220729,
      "keys": {
      },
      "componentGenerator": {
        "sourceTypeLocation": "../fixtures/NumberStringType.mts",
        "sourceTypeAlias": "NumberStringType",
        "targetDirLocation": "../spec-generated",
        "baseClassName": "NumberStringClass",
        "entryTypeAlias": "NumberStringClass",
      }
    };
  });

  describe("accepts raw data with", () => {
    it("no keys and a componentGenerator", () => {
      expect(StaticValidator([rawData])).toBeTruthy();
    });

    it("a component key and a class generator", () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
      };
      expect(StaticValidator([rawData])).toBeTruthy();
    });

    it("a component key, a start component and a class generator", () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
      };
      rawData.startComponent = "foo";
      expect(StaticValidator([rawData])).toBeTruthy();
    });

    it("a component key, a sequence and a class generator", () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
      };
      rawData.keys.bar = {
        "type": "sequence",
        "subkeys": ["foo"]
      };
      rawData.startComponent = "bar";
      expect(StaticValidator([rawData])).toBeTruthy();
    });

    it("a sourceDirectories property containing strings", () => {
      rawData.sourceDirectories = [
        "foo"
      ];
      expect(StaticValidator([rawData])).toBeTruthy();
    });
  });

  describe("throws for", () => {
    it("a top-level value that isn't an array of BuildData objects", () => {
      expect(
        () => StaticValidator(rawData)
      ).toThrowError("data did not pass schema");
    });

    it("an empty array of BuildData objects", () => {
      expect(
        () => StaticValidator([])
      ).toThrowError("data did not pass schema");
    });

    it("a missing set of keys", () => {
      delete rawData.keys;
      let x: Error = new Error;
      expect(
        () => {
          try {
            StaticValidator([rawData]);
          }
          catch (ex) {
            x = ex as Error;
            throw ex;
          }
        }
      ).toThrowError("data did not pass schema");

      expect(x.cause).toBeInstanceOf(AggregateError);
      if (x.cause instanceof AggregateError) {
        expect(x.cause.errors.length).toBe(1);
        expect(x.cause.errors[0].message).toBe("must have required property 'keys'");
      }
    });

    it("a schemaDate mismatch", () => {
      rawData.schemaDate = 20220728;
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");


      delete rawData.schemaDate;
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a missing componentGenerator", () => {
      delete rawData.componentGenerator;
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("an extra property on the raw data", () => {
      rawData.extra = true;
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a component key missing a file property", () => {
      rawData.keys.foo = {
        "type": "component",
      };
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a sequence key missing a subkeys property", () => {
      rawData.keys.foo = {
        "type": "sequence",
      };
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a key not matching the type", () => {
      rawData.keys.foo = {
        "type": "foo",
        "file": "foo.mjs",
      };
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a component key with an extra property", () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
        "extra": true,
      };
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a component key whose file doesn't end in .mjs", () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mts",
      };
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a sequence key with an extra property", () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
      };
      rawData.keys.bar = {
        "type": "sequence",
        "subkeys": ["foo"],
        "extra": true,
      };
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a sequence key with subkeys not being an array of strings", () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
      };
      rawData.keys.bar = {
        "type": "sequence",
        "subkeys": [true],
      };
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");

      rawData.keys.bar.subkeys = true;
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a sequence key with duplicate subkeys", () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
      };
      rawData.keys.bar = {
        "type": "sequence",
        "subkeys": ["foo", "foo"],
      };
      expect(
        () => StaticValidator([rawData])
      ).toThrowError(`Missed subkey (maybe a duplicate?) : "foo"`);
    });

    it("two sequence keys sharing a subkey", () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
      };
      rawData.keys.bar = {
        "type": "sequence",
        "subkeys": ["foo"],
      };

      rawData.keys.wop = {
        "type": "sequence",
        "subkeys": ["foo"],
      };
      expect(
        () => StaticValidator([rawData])
      ).toThrowError(`Missed subkey (maybe a duplicate?) : "foo"`);
    });

    it("a sequence key with a missed subkey", () => {
      rawData.keys.bar = {
        "type": "sequence",
        "subkeys": ["foo"],
      };
      expect(
        () => StaticValidator([rawData])
      ).toThrowError(`Missed subkey (maybe a duplicate?) : "foo"`);
    });

    it("a start component that doesn't point to a named key", () => {
      rawData.keys.foo = {
        "type": "component",
        "file": "foo.mjs",
      };
      rawData.keys.bar = {
        "type": "sequence",
        "subkeys": ["foo"],
      };

      rawData.startComponent = "wop";
      expect(
        () => StaticValidator([rawData])
      ).toThrowError(`Start component name "wop" does not have a component or sequence!`);
    });

    describe("a class generator", () => {
      it("missing a sourceTypeLocation", () => {
        rawData.componentGenerator.sourceTypeLocation = "";
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");

        delete rawData.componentGenerator.sourceTypeLocation;
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");
      });

      it("missing a sourceTypeAlias", () => {
        rawData.componentGenerator.sourceTypeAlias = "";
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");

        delete rawData.componentGenerator.sourceTypeAlias;
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");
      });

      it("missing a targetDirLocation", () => {
        rawData.componentGenerator.targetDirLocation = "";
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");

        delete rawData.componentGenerator.targetDirLocation;
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");
      });

      it("missing a baseClassName", () => {
        rawData.componentGenerator.baseClassName = "";
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");

        delete rawData.componentGenerator.baseClassName;
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");
      });

      it("missing an entryTypeAlias", () => {
        rawData.componentGenerator.entryTypeAlias = "";
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");

        delete rawData.componentGenerator.entryTypeAlias;
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");
      });

      it("with an extra property", () => {
        rawData.componentGenerator.extra = true;
        expect(
          () => StaticValidator([rawData])
        ).toThrowError("data did not pass schema");
      });
    });

    it("a sourceDirectories empty array property", () => {
      rawData.sourceDirectories = [];
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a sourceDirectories non-array property", () => {
      rawData.sourceDirectories = true;
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });

    it("a sourceDirectories array property containing values other than non-empty strings", () => {
      rawData.sourceDirectories = ["foo", ""];
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");

      rawData.sourceDirectories = ["foo", true];
      expect(
        () => StaticValidator([rawData])
      ).toThrowError("data did not pass schema");
    });
  });
});
