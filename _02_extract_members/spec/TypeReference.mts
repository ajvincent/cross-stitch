import ts from "ts-morph";

import router from "../source/router.mjs";
import {
  getAliasTypeNodeByName
} from "../../_00_shared_utilities/spec-utilities/BasicTypesSource.mjs";

import matchTypeAndName from "../spec-utilities/matchTypeAndName.mjs";
import onlyFieldNodes from "../spec-utilities/onlyFieldNodes.mjs";

describe("TypeNodesWithChildren/TypeReference picks up signatures from", () => {
  const {
    PropertySignature,
    GetAccessor,
    SetAccessor,
  } = ts.SyntaxKind;

  it("primitive type aliases", () => {
    const reference = getAliasTypeNodeByName<ts.SyntaxKind.TypeReference>(
      "oneStringTypeAlias", ts.SyntaxKind.TypeReference
    );

    const results = router(reference);
    expect(results.fieldNodes.length).toBe(0);

    expect(results.unresolvedTypeNodes.length).toBe(1);
    const unresolved = results.unresolvedTypeNodes[0].asKindOrThrow(
      ts.SyntaxKind.LiteralType
    );
    const literal = unresolved.getLiteral().asKindOrThrow(ts.SyntaxKind.StringLiteral);
    expect(literal.getLiteralValue()).toBe("one string");

    onlyFieldNodes({
      ...results,
      unresolvedTypeNodes: []
    });
  });

  it("object type aliases without type parameters", () => {
    const reference = getAliasTypeNodeByName<ts.SyntaxKind.TypeReference>(
      "objectWithFooPropertyAlias", ts.SyntaxKind.TypeReference
    );

    const results = router(reference);
    expect(results.fieldNodes.length).toBe(1);

    matchTypeAndName(results.fieldNodes[0], PropertySignature, "fooObject");
    onlyFieldNodes(results);
  });

  it("object type aliases with type parameters", () => {
    const reference = getAliasTypeNodeByName<ts.SyntaxKind.TypeReference>(
      "GetterAndSetterString", ts.SyntaxKind.TypeReference
    );

    const results = router(reference);
    expect(results.fieldNodes.length).toBe(3);

    matchTypeAndName(results.fieldNodes[0], GetAccessor, "value");
    matchTypeAndName(results.fieldNodes[1], SetAccessor, "value");
    matchTypeAndName(results.fieldNodes[2], PropertySignature, "other");

    onlyFieldNodes(results);
  });
});
