import ts from "ts-morph";

import router from "../../source/ExtractMembers/router.mjs";
import {
  getAliasTypeNodeByName
} from "../../../_00_shared_utilities/spec-utilities/BasicTypesSource.mjs";

import matchTypeAndName from "../../spec-utilities/matchTypeAndName.mjs";
import onlyFieldNodes from "../../spec-utilities/onlyFieldNodes.mjs";

describe("ExtractMembers/TypeLiteral gets signatures for type literals:", () => {
  const {
    MethodSignature,
    PropertySignature,
    GetAccessor,
    SetAccessor,
  } = ts.SyntaxKind;

  it("property", () => {
    const literal = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
      "objectWithFooProperty", ts.SyntaxKind.TypeLiteral
    );

    const results = router(literal);
    expect(results.fieldNodes.length).toBe(1);

    matchTypeAndName(results.fieldNodes[0], PropertySignature, "fooObject");
    onlyFieldNodes(results);
  });

  it("method", () => {
    const literal = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
      "NumberStringType", ts.SyntaxKind.TypeLiteral
    );

    const results = router(literal);
    expect(results.fieldNodes.length).toBe(2);

    matchTypeAndName(results.fieldNodes[0], MethodSignature, "repeatForward");
    matchTypeAndName(results.fieldNodes[1], MethodSignature, "repeatBack");

    onlyFieldNodes(results);
  });

  it("accessor", () => {
    const literal = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
      "GetterAndSetter", ts.SyntaxKind.TypeLiteral
    );

    const results = router(literal);
    expect(results.fieldNodes.length).toBe(3);

    matchTypeAndName(results.fieldNodes[0], GetAccessor, "value");
    matchTypeAndName(results.fieldNodes[1], SetAccessor, "value");
    matchTypeAndName(results.fieldNodes[2], PropertySignature, "other");

    onlyFieldNodes(results);
  });

  it("call", () => {
    const literal = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
      "CallableType", ts.SyntaxKind.TypeLiteral
    );

    const results = router(literal);
    expect(results.fieldNodes.length).toBe(0);
    expect(results.callSignatures.length).toBe(2);

    onlyFieldNodes({
      ...results,
      callSignatures: []
    });
  });

  it("construct", () => {
    const literal = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
      "ConstructableType", ts.SyntaxKind.TypeLiteral
    );

    const results = router(literal);
    expect(results.fieldNodes.length).toBe(0);
    expect(results.constructorSignatures.length).toBe(2);

    onlyFieldNodes({
      ...results,
      constructorSignatures: []
    });
  });

  it("index", () => {
    const literal = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
      "ManyPropertiesWithRequired", ts.SyntaxKind.TypeLiteral
    );

    const results = router(literal);
    expect(results.fieldNodes.length).toBe(1);
    matchTypeAndName(results.fieldNodes[0], PropertySignature, "mustExist");

    expect(results.indexSignatures.length).toBe(1);
    onlyFieldNodes({
      ...results,
      indexSignatures: []
    });
  });
});
