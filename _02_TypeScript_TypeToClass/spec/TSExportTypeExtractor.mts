import {
  TSExportTypeFilterDecider,
  TSExportTypeExtractor,
} from "../source/TSExportTypeExtractor.mjs";

import ESTreeParser from "../../_01_TypeScript_ESTree/source/ESTreeParser.mjs";
import ESTreeTraversal from "../../_01_TypeScript_ESTree/source/ESTreeTraversal.mjs";

import type {
  AST, TSESTreeOptions
} from "@typescript-eslint/typescript-estree";

describe("TSExportTypeExtractor", () => {
  function extractExport(typeToExtract: string, source: string) : TSExportTypeExtractor
  {
    const ast: AST<TSESTreeOptions> = ESTreeParser(source);

    const traversal: ESTreeTraversal = new ESTreeTraversal(
      ast, TSExportTypeFilterDecider
    );

    const extractor: TSExportTypeExtractor = new TSExportTypeExtractor(typeToExtract);
    traversal.traverseEnterAndLeave(ast, extractor);

    return extractor;
  }

  const NST_SOURCE = `
export type NumberStringType = {
  repeatForward(s: string, n: number): string;
  repeatBack(n: number, s: string): string;
};
`.trim() + "\n";

  const REPEATER_SOURCE = `
export interface Repeater<T extends string>
{
  repeatBack(n: number, s: T): string;
};

export interface Repeater<T extends string>
{
  repeatForward(s: string, n: number) : string;
}
`.trim() + "\n";

  it("extracts an exported type for NumberStringType", () => {
    const extractor = extractExport("NumberStringType", NST_SOURCE);

    expect(extractor.exportTypeFound).toBe(true);
    expect(extractor.typeNodes.size).toBe(1);

    expect(
      () => extractor.analyze()
    ).not.toThrow();
  });

  it("extracts an exported type with no methods", () => {
    const extractor = extractExport(
      "Foo",
      `export type Foo = "Foo";`
    );

    expect(extractor.exportTypeFound).toBe(true);
    expect(extractor.typeNodes.size).toBe(1);

    expect(
      () => extractor.analyze()
    ).not.toThrow();
  });

  it("extracts an interface defined in two places", () => {
    const extractor = extractExport("Repeater", REPEATER_SOURCE);

    expect(extractor.exportTypeFound).toBe(true);
    expect(extractor.typeNodes.size).toBe(2);

    expect(
      () => extractor.analyze()
    ).not.toThrow();
  });

  it("reports when a type isn't found", () => {
    const extractor = extractExport("Repeater", NST_SOURCE);

    expect(extractor.exportTypeFound).toBe(false);
    expect(extractor.typeNodes.size).toBe(0);

    expect(
      () => extractor.analyze()
    ).not.toThrow();
  });

  it("reports when a type isn't exported", () => {
    const extractor = extractExport(
      "Foo",
      `type Foo = "Foo";`
    );

    expect(extractor.exportTypeFound).toBe(false);
    expect(extractor.typeNodes.size).toBe(1);

    expect(
      () => extractor.analyze()
    ).not.toThrow();
  });
});
