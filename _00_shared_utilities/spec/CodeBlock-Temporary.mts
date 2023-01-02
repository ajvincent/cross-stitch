import ts from "ts-morph";
import CodeBlockTemporary from "../source/CodeBlock-Temporary.mjs";

import {
  BasicTypes,
} from "../spec-utilities/BasicTypesSource.mjs";

it("CodeBlock-Temporary creates temporary statement blocks", () => {
  const block = new CodeBlockTemporary(BasicTypes);

  const firstAlias = block.addTypeAlias(`"foo"`);
  expect(firstAlias.getTypeNode()?.asKindOrThrow(ts.SyntaxKind.LiteralType).getText()).toBe('"foo"');

  expect(BasicTypes.getTypeAlias(firstAlias.getName())).toBe(undefined);

  block.finalize();
  expect(
    () => firstAlias.getTypeNode()
  ).toThrow();
});
