import ESTreeFile from "../source/ESTreeFile.mjs";
import DecideEnumTraversal from "../source/DecideEnumTraversal.mjs";

import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";
type TSNode = TSESTree.TSESTree.Node;

import path from "path";

const FIXTURES_ROOT = path.resolve("./_02_TypeScript_tools/fixtures");

describe("ESTreeFile", () => {
  class NodeStack {
    readonly stack: TSNode[] = [];
    readonly mismatches: Array<[TSNode | undefined, TSNode | undefined]> = [];
    firstVisited: TSNode | undefined;

    push(n: TSNode) : void
    {
      this.stack.unshift(n);
      if (!this.firstVisited)
        this.firstVisited = n;
    }
    pop(n: TSNode): void
    {
      const top = this.stack.shift();
      if (top !== n)
        this.mismatches.push([top, n]);
    }

    expectEmpty() : void
    {
      expect(this.stack.length).toBe(0);
      expect(this.mismatches.length).toBe(0);
    }
  }

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
