import ESTreeFile from "../source/ESTreeFile.mjs";
import DecideEnumTraversal from "../source/DecideEnumTraversal.mjs";
import NodeStack from "./tools/NodeStack.mjs";

import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";
type TSNode = TSESTree.TSESTree.Node;

import path from "path";

const FIXTURES_ROOT = path.resolve("./_02_TypeScript_tools/fixtures");

describe("ESTreeFile", () => {
  let traversalDecision: DecideEnumTraversal<TSNode["type"]>;

  class TestSpy extends ESTreeFile {
    sequences = new NodeStack;
    unregisteredEnter(n: TSNode) : boolean
    {
      this.sequences.push(n);
      return true;
    }

    unregisteredLeave(n: TSNode) : void
    {
      this.sequences.pop(n);
    }
  }

  let spyTraversal: TestSpy;

  it("parses a simple string type cleanly", async () => {
    const pathToFile = path.join(FIXTURES_ROOT, "SimpleStringType.mts");

    traversalDecision = ESTreeFile.buildTypeTraversal();
    traversalDecision.runFilter(
      (s) => {
        void(s);
        return true;
      },
      true,
      DecideEnumTraversal.Decision.Accept
    );

    spyTraversal = new TestSpy(pathToFile, traversalDecision);

    await spyTraversal.run();
    spyTraversal.sequences.expectEmpty();
    expect(spyTraversal.sequences.firstVisited?.type).toBe(AST_NODE_TYPES.Program);
  });
});
