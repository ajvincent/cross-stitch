import ts from "ts-morph";

import router from "../source/router.mjs";
import traverseAST from "../source/traverseAST.mjs";
import {
  BasicTypes,
  getAliasTypeNodeByName
} from "../../_00_shared_utilities/spec-utilities/BasicTypesSource.mjs";

it("ExtractMembers/router takes TypeAliasDeclaration nodes", () => {
  const literal = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
    "objectWithFooProperty", ts.SyntaxKind.TypeLiteral
  );

  const exportedAlias = BasicTypes.getTypeAliasOrThrow("objectWithFooProperty");

  const literalData = router(literal);
  const aliasData = router(exportedAlias);

  expect(aliasData).toEqual(literalData);
});

it("ExtractMembers/traverseAST supports exported TypeAliasDeclaration nodes", () => {
  const literal = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
    "objectWithFooProperty", ts.SyntaxKind.TypeLiteral
  );
  const routerData = router(literal);

  const exportedAlias = BasicTypes.getTypeAliasOrThrow("objectWithFooProperty");

  const actual = traverseAST(exportedAlias);

  expect(actual)
    .withContext("type alias resolving to its type node")
    .toEqual([true, routerData]);
});

it("ExtractMembers/traverseAST reports nothing for non-exported TypeAliasDeclaration nodes", () => {
  const nonExportedAlias = BasicTypes.getTypeAliasOrThrow("FullSandwich");

  const actual = traverseAST(nonExportedAlias);
  expect(actual).toEqual([false, undefined]);
});
