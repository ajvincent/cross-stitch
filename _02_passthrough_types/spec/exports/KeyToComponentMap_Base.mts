import InstanceToComponentMap from "../../source/exports/KeyToComponentMap_Base.mjs";

import {
  NST_CONTINUE,
  NST_RESULT,
  NST_THROW,
} from "../../fixtures/first-mock/NST_INSTANCES.mjs";

import type {
  NumberStringType
} from "../../fixtures/NumberStringType.mjs";

describe("InstanceToComponentMap", () => {
  const stubType0: NumberStringType =
  {
    repeatForward(s, n) {
      void(s);
      void(n);
      throw new Error("not implemented");
    },
    repeatBack(n, s) {
      void(s);
      void(n);
      throw new Error("not implemented");
    }
  };

  const stubType1: NumberStringType =
  {
    repeatForward(s, n) {
      void(s);
      void(n);
      throw new Error("not implemented");
    },
    repeatBack(n, s) {
      void(s);
      void(n);
      throw new Error("not implemented");
    }
  };

  let map: InstanceToComponentMap<NumberStringType>;
  beforeEach(() => map = new InstanceToComponentMap);

  it("instances are frozen", () => {
    expect(Object.isFrozen(map)).toBe(true);
  });

  it("shows default keys and inserted components", () => {
    expect(Array.from(map.defaultKeys)).toEqual([]);

    map.addDefaultComponent("continue", NST_CONTINUE);
    expect(Array.from(map.defaultKeys)).toEqual(["continue"]);
    expect(map.getComponent(stubType0, "continue")).toBe(NST_CONTINUE);

    map.addDefaultComponent("throw", NST_THROW);
    expect(Array.from(map.defaultKeys)).toEqual(["continue", "throw"]);
    expect(map.getComponent(stubType0, "continue")).toBe(NST_CONTINUE);
    expect(map.getComponent(stubType0, "throw")).toBe(NST_THROW);

    map.addDefaultComponent("result", NST_RESULT);
    expect(Array.from(map.defaultKeys)).toEqual([
      "continue", "throw", "result"
    ]);
    expect(map.getComponent(stubType0, "continue")).toBe(NST_CONTINUE);
    expect(map.getComponent(stubType0, "throw")).toBe(NST_THROW);
    expect(map.getComponent(stubType0, "result")).toBe(NST_RESULT);
  });

  it(".override hides components except for those we defined", () => {
    map.addDefaultComponent("continue", NST_CONTINUE);
    map.addDefaultComponent("result", NST_THROW);

    const submap = map.override(stubType1, ["continue"]);
    expect(Array.from(submap.keys)).toEqual(["continue"]);
    expect(submap.getComponent("continue")).toBe(NST_CONTINUE);

    submap.addComponent("result", NST_RESULT);
    expect(Array.from(submap.keys)).toEqual(["continue", "result"]);
    expect(submap.getComponent("result")).toBe(NST_RESULT);

    expect(map.getComponent(stubType0, "continue")).toBe(NST_CONTINUE);
    expect(map.getComponent(stubType0, "result")).toBe(NST_THROW);

    expect(map.getComponent(stubType1, "continue")).toBe(NST_CONTINUE);
    expect(map.getComponent(stubType1, "result")).toBe(NST_RESULT);
  });

  it("allows setting a start component after the component is defined", () => {
    expect(map.defaultStart).toBe(undefined);

    map.addDefaultComponent("continue", NST_CONTINUE);
    expect(map.defaultStart).toBe(undefined);

    map.defaultStart = "continue";
    expect(map.defaultStart).toBe("continue");
  });

  describe("throws for trying to", () => {
    it("define a component twice", () => {
      map.addDefaultComponent("continue", NST_CONTINUE);
      expect(
        () => map.addDefaultComponent("continue", NST_CONTINUE)
      ).toThrowError("Key is already defined!");
    });

    it("retrieve an undefined component", () => {
      expect(
        () => map.getComponent(stubType0, "continue")
      ).toThrowError("No component match!");
    });

    describe("set the start component", () => {
      it("to undefined", () => {
        expect(
          () => map.defaultStart = undefined
        ).toThrowError("Start component must be a non-empty string or a symbol!");
      });

      it("to an empty string", () => {
        expect(
          () => map.defaultStart = ""
        ).toThrowError("key cannot be an empty string!");
      });

      it("to a key we haven't defined yet", () => {
        expect(
          () => map.defaultStart = "continue"
        ).toThrowError("You haven't registered the start component yet!");
      });

      it("after we've successfully set it", () => {
        map.addDefaultComponent("continue", NST_CONTINUE);
        map.defaultStart = "continue";
        expect(
          () => map.defaultStart = "continue"
        ).toThrowError("This map already has a start component!");
      });
    });
  });
});
