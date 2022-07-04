import DecideEnumTraversal from "../source/DecideEnumTraversal.mjs";

describe("DecideEnumTraversal", () => {
  const strings = ["foo", "bar", "food"];
  let d: DecideEnumTraversal<string>;
  beforeEach(() => {
    d = new DecideEnumTraversal(new Set(strings));
  });

  it("initializes with no decisions", () => {
    expect(d.decisionMap.size).toBe(0);
    expect(d.remaining).toEqual(strings);
  });

  describe("sets decisions on strings positively matching a", () => {
    it("string array", () => {
      expect(
        d.runFilter(["bar", "foo", "wop"], true, DecideEnumTraversal.Decision.Accept)
      ).toEqual([]);
      expect(d.decisionMap.size).toBe(2);
      expect(d.decisionMap.get("bar")).toBe(DecideEnumTraversal.Decision.Accept);
      expect(d.decisionMap.get("foo")).toBe(DecideEnumTraversal.Decision.Accept);
      expect(d.remaining).toEqual(["food"]);
    });

    it("regular expression", () => {
      expect(
        d.runFilter(/^fo/, true, DecideEnumTraversal.Decision.Skip)
      ).toEqual([]);
      expect(d.decisionMap.size).toBe(2);
      expect(d.decisionMap.get("foo")).toBe(DecideEnumTraversal.Decision.Skip);
      expect(d.decisionMap.get("food")).toBe(DecideEnumTraversal.Decision.Skip);
      expect(d.remaining).toEqual(["bar"]);
    });

    it("function", () => {
      expect(
        d.runFilter((s => s.includes("o")), true, DecideEnumTraversal.Decision.RejectChildren)
      ).toEqual([]);
      expect(d.decisionMap.get("foo")).toBe(DecideEnumTraversal.Decision.RejectChildren);
      expect(d.decisionMap.get("food")).toBe(DecideEnumTraversal.Decision.RejectChildren);
      expect(d.remaining).toEqual(["bar"]);
    });
  });

  describe("sets decisions on strings negatively matching a", () => {
    it("string array", () => {
      expect(
        d.runFilter(["bar", "foo", "wop"], false, DecideEnumTraversal.Decision.Accept)
      ).toEqual([]);
      expect(d.decisionMap.size).toBe(1);
      expect(d.decisionMap.get("food")).toBe(DecideEnumTraversal.Decision.Accept);
      expect(d.remaining).toEqual(["foo", "bar"]);
    });

    it("regular expression", () => {
      expect(
        d.runFilter(/^fo/, false, DecideEnumTraversal.Decision.Skip)
      ).toEqual([]);
      expect(d.decisionMap.size).toBe(1);
      expect(d.decisionMap.get("bar")).toBe(DecideEnumTraversal.Decision.Skip);
      expect(d.remaining).toEqual(["foo", "food"]);
    });

    it("function", () => {
      expect(
        d.runFilter((s => s.includes("o")), false, DecideEnumTraversal.Decision.RejectChildren)
      ).toEqual([]);
      expect(d.decisionMap.size).toBe(1);
      expect(d.decisionMap.get("bar")).toBe(DecideEnumTraversal.Decision.RejectChildren);
      expect(d.remaining).toEqual(["foo", "food"]);
    });
  });

  it("decisions are final", () => {
    d.runFilter((s => s.includes("o")), true, DecideEnumTraversal.Decision.Reject);
    expect(
      d.runFilter(["bar", "foo", "wop"], true, DecideEnumTraversal.Decision.Accept)
    ).toEqual(["foo"]); // for the already decided value.

    expect(d.decisionMap.size).toBe(3);
    expect(d.decisionMap.get("bar")).toBe(DecideEnumTraversal.Decision.Accept);
    expect(d.decisionMap.get("foo")).toBe(DecideEnumTraversal.Decision.Reject);
    expect(d.decisionMap.get("food")).toBe(DecideEnumTraversal.Decision.Reject);
    expect(d.remaining).toEqual([]);
  });
});
