import {
  TSExportTypeFilterDecider,
  TSExportTypeExtractor,
} from "../source/TSTypeToClass.mjs";

import ESTreeParser from "../source/ESTreeParser.mjs";
import ESTreeTraversal from "../source/ESTreeTraversal.mjs";
import FileCache from "../source/FileCache.mjs";

const NST_SOURCE = await FileCache(
  import.meta,
  "../../fixtures/NumberStringType.mts"
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
