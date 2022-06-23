import { TSESTree } from "@typescript-eslint/typescript-estree";
import ExportDefaultFields from "../../spec-tools/ExportDefaultEnterLeave.mjs";

describe(`Generated "not-implemented" classes have correct methods and properties: `, () => {
  it(`NST_NotImplemented.mts expects ["repeatForward", "repeatBack"]`, async () => {
    const nodes = await ExportDefaultFields("NST_NotImplemented.mts");

    expect(nodes.map(n => (n.key as TSESTree.Identifier).name)).toEqual([
      "repeatForward",
      "repeatBack",
    ]);
  });

  it(`NST_NotImplemented_Partial.mts expects ["repeatForward"]`, async () => {
    const nodes = await ExportDefaultFields("NST_NotImplemented_Partial.mts");

    expect(nodes.map(n => (n.key as TSESTree.Identifier).name)).toEqual([
      "repeatForward",
    ]);
  });

  it(`NST_Bar_NotImplemented.mts expects ["repeatForward", "repeatBack", "repeatBar"]`, async () => {
    const nodes = await ExportDefaultFields("NST_Bar_NotImplemented.mts");

    expect(nodes.map(n => (n.key as TSESTree.Identifier).name)).toEqual([
      "repeatForward",
      "repeatBack",
      "repeatBar",
    ]);
  });
});
