import {
  TSExportTypeFilterDecider,
  TSExportTypeExtractor,
} from "../source/TSExportTypeExtractor.mjs";

import ESTreeParser from "../../_02a_TypeScript_ESTree/source/ESTreeParser.mjs";
import ESTreeTraversal from "../../_02a_TypeScript_ESTree/source/ESTreeTraversal.mjs";
import FileCache from "../../_02a_TypeScript_ESTree/source/FileCache.mjs";

const NST_SOURCE = await FileCache(
  import.meta,
  "../../../_02a_TypeScript_ESTree/fixtures/NumberStringType.mts"
);

describe("TSExportTypeExtractor", () => {
  const ast = ESTreeParser(NST_SOURCE);
  let traversal: ESTreeTraversal;
  let extractor: TSExportTypeExtractor;

  beforeEach(() => {
    traversal = new ESTreeTraversal(
      ast, TSExportTypeFilterDecider
    );
  });

  it("extracts an exported type for NumberStringType", () => {
    traversal = new ESTreeTraversal(
      ast, TSExportTypeFilterDecider
    );

    extractor = new TSExportTypeExtractor("NumberStringType");
    traversal.traverseEnterAndLeave(ast, extractor);

    expect(extractor.exportTypeFound).toBe(true);
    expect(extractor.typeNodes.size).toBe(1);
  });
});
