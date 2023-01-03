import ts from "ts-morph";

import router from "../source/router.mjs";
import {
  getAliasTypeNodeByName
} from "../../_00_shared_utilities/spec-utilities/BasicTypesSource.mjs";

import onlyFieldNodes from "../spec-utilities/onlyFieldNodes.mjs";

describe("TypeNodesWithChildren/UnknownTypeNode picks up", () => {
  it("primitive type aliases", () => {
    const literalType = getAliasTypeNodeByName<ts.SyntaxKind.LiteralType>(
      "oneStringType", ts.SyntaxKind.LiteralType
    );

    const results = router(literalType);
    expect(results.fieldNodes.length).toBe(0);

    expect(results.unresolvedTypeNodes.length).toBe(1);
    const unresolved = results.unresolvedTypeNodes[0];
    expect(unresolved).toBe(literalType);

    const literal = literalType.getLiteral().asKindOrThrow(ts.SyntaxKind.StringLiteral);
    expect(literal.getLiteralValue()).toBe("one string");

    onlyFieldNodes({
      ...results,
      unresolvedTypeNodes: []
    });
  });
});
