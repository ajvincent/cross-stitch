import ts from "ts-morph";

import mergeChildLists from "../source/mergeChildLists.mjs";
import {
  getAliasTypeNodeByName
} from "../../_00_shared_utilities/spec-utilities/BasicTypesSource.mjs";

import matchTypeAndName from "../spec-utilities/matchTypeAndName.mjs";
import onlyFieldNodes from "../spec-utilities/onlyFieldNodes.mjs";

const {
  MethodSignature,
  PropertySignature,
} = ts.SyntaxKind;

it("TypeNodesWithChildren/mergeChildLists does what its name suggests", () => {
  const literal1 = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
    "objectWithFooProperty", ts.SyntaxKind.TypeLiteral
  );

  const literal2 = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
    "NumberStringType", ts.SyntaxKind.TypeLiteral
  );

  const results = mergeChildLists([literal1, literal2]);

  expect(results.fieldNodes.length).toBe(3);
  matchTypeAndName(results.fieldNodes[0], PropertySignature, "fooObject");
  matchTypeAndName(results.fieldNodes[1], MethodSignature, "repeatForward");
  matchTypeAndName(results.fieldNodes[2], MethodSignature, "repeatBack");

  onlyFieldNodes(results);
});

it("TypeNodesWithChildren/mergeChildLists reports each signature once", () => {
  const literal1 = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
    "objectWithFooProperty", ts.SyntaxKind.TypeLiteral
  );

  const literal2 = getAliasTypeNodeByName<ts.SyntaxKind.TypeLiteral>(
    "NumberStringType", ts.SyntaxKind.TypeLiteral
  );

  const results = mergeChildLists([literal1, literal2, literal2, literal1, literal2]);

  expect(results.fieldNodes.length).toBe(3);
  matchTypeAndName(results.fieldNodes[0], PropertySignature, "fooObject");
  matchTypeAndName(results.fieldNodes[1], MethodSignature, "repeatForward");
  matchTypeAndName(results.fieldNodes[2], MethodSignature, "repeatBack");

  onlyFieldNodes(results);
});
