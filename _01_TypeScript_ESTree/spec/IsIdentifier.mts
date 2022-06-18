import IsIdentifier from "../source/IsIdentifier.mjs";

it("IsIdentifier() returns true for identifiers, false for other values", () => {
  expect(IsIdentifier("x")).toBe(true);
  expect(IsIdentifier("__foo__")).toBe(true);
  expect(IsIdentifier("12")).toBe(false);
  expect(IsIdentifier("class")).toBe(false);
  expect(IsIdentifier("x = 3")).toBe(false);
  expect(IsIdentifier(`expect(IsIdentifier("class")).toBe(false);`)).toBe(false);
});
