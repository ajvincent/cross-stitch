import ts from "ts-morph";

import router from "../source/router.mjs";
import traverseAST from "../source/traverseAST.mjs";
import {
  BasicTypes
} from "../../_00_shared_utilities/spec-utilities/BasicTypesSource.mjs";

const {
  PropertySignature,
} = ts.SyntaxKind;

import matchTypeAndName from "../spec-utilities/matchTypeAndName.mjs";
import onlyFieldNodes from "../spec-utilities/onlyFieldNodes.mjs";

it("ExtractMembers/router gets signatures for a single declaration node", () => {
  const decl = BasicTypes.getInterfaceOrThrow("FooInterface");
  const results = router(decl);

  expect(results.fieldNodes.length).toBe(1);

  matchTypeAndName(results.fieldNodes[0], PropertySignature, "foo");
  onlyFieldNodes(results);
});

it("ExtractMembers/traversalAST returns [false, undefined] for a non-exported interface", () => {
  const decl = BasicTypes.getInterfaceOrThrow("ExtendedWop");
  const [exported, results] = traverseAST(decl);
  expect(exported).toBe(false);
  expect(results).toBe(undefined);
});

describe("ExtractMembers/traversalAST gets signatures for exported interfaces", () => {
  it("for all declaration nodes", () => {
    const decl = BasicTypes.getInterfaceOrThrow("FooInterface");
    const [exported, results] = traverseAST(decl);

    expect(exported).toBe(true);
    if (!exported)
      return;

    expect(results.fieldNodes.length).toBe(2);

    matchTypeAndName(results.fieldNodes[0], PropertySignature, "foo");
    matchTypeAndName(results.fieldNodes[1], PropertySignature, "foo2");
    onlyFieldNodes(results);
  });

  xit("for the interfaces it extends", () => {
    const decl = BasicTypes.getInterfaceOrThrow("BarInterface");
    const [exported, results] = traverseAST(decl);

    expect(exported).toBe(true);
    if (!exported)
      return;

    expect(results.fieldNodes.length).toBe(4);

    matchTypeAndName(results.fieldNodes[0], PropertySignature, "foo");
    matchTypeAndName(results.fieldNodes[1], PropertySignature, "foo2");
    matchTypeAndName(results.fieldNodes[2], PropertySignature, "bar");
    onlyFieldNodes(results);
  });
});
