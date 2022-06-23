import TSESTree, {AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

import DecideEnumTraversal, { Decision } from "../source/DecideEnumTraversal.mjs";
import ESTreeTraversal, { ESTreeEnterLeave } from "../source/ESTreeTraversal.mjs";

import NodeStack from "../spec-tools/NodeStack.mjs";

type TSNode = TSESTree.TSESTree.Node;

describe("ESTreeTraversal", () => {
  const tsSource = `export type Foo = "Foo";\n`;

  function returnTrue(s: string) : true {
    void(s);
    return true;
  }

  class TypesVisitedSpy implements ESTreeEnterLeave
  {
    spyEnter = jasmine.createSpy();
    spyLeave = jasmine.createSpy();

    stack = new NodeStack;

    enter(n: TSNode) : boolean
    {
      this.spyEnter(n.type);
      this.stack.push(n);
      return true;
    }

    leave(n: TSNode) : void
    {
      this.stack.pop(n);
      this.spyLeave(n.type);
    }
  }

  let ast: TSESTree.TSESTree.Program,
      decider: DecideEnumTraversal<TSNode["type"]>,
      typesVisited: TypesVisitedSpy;

  beforeEach(() => {
    // XXX ajvincent Technically, I should use parse from @typescript-eslint/parser.
    ast = TSESTree.parse(tsSource,  {
      errorOnUnknownASTType: false,
      loc: true,
      filePath: "",
      range: true
    });

    const types: Set<TSNode["type"]> = new Set(
      Object.values(AST_NODE_TYPES)
    );
    decider = new DecideEnumTraversal(new Set(types));
    typesVisited = new TypesVisitedSpy;
  });

  function decideRemainingAsAccept() : void
  {
    decider.runFilter(returnTrue, true, Decision.Accept);
  }

  let traversal: ESTreeTraversal

  it("on accept, visits each node twice", () => {
    decideRemainingAsAccept();
    traversal = new ESTreeTraversal(ast, decider);
    traversal.traverseEnterAndLeave(ast, typesVisited);

    typesVisited.stack.expectEmpty();
    [
      "Program",
      "ExportNamedDeclaration",
      "TSTypeAliasDeclaration",
      "Identifier",
      "TSLiteralType",
      "Literal"
    ].forEach(type => {
      expect(typesVisited.spyEnter).toHaveBeenCalledWith(type);
      expect(typesVisited.spyLeave).toHaveBeenCalledWith(type);
    });

    expect(typesVisited.spyEnter).toHaveBeenCalledTimes(6);
    expect(typesVisited.spyLeave).toHaveBeenCalledTimes(6);
  });

  it("on rejectChildren, excludes descendants of the node", () => {
    decider.runFilter(
      [AST_NODE_TYPES.TSTypeAliasDeclaration], true, Decision.RejectChildren
    );
    decideRemainingAsAccept();

    traversal = new ESTreeTraversal(ast, decider);
    traversal.traverseEnterAndLeave(ast, typesVisited);

    typesVisited.stack.expectEmpty();
    [
      "Program",
      "ExportNamedDeclaration",
      "TSTypeAliasDeclaration",
    ].forEach(type => {
      expect(typesVisited.spyEnter).toHaveBeenCalledWith(type);
      expect(typesVisited.spyLeave).toHaveBeenCalledWith(type);
    });

    expect(typesVisited.spyEnter).toHaveBeenCalledTimes(3);
    expect(typesVisited.spyLeave).toHaveBeenCalledTimes(3);
  });

  it("on skip, excludes only the skipped nodes", () => {
    decider.runFilter(
      [AST_NODE_TYPES.TSTypeAliasDeclaration], true, Decision.Skip
    );
    decideRemainingAsAccept();
    traversal = new ESTreeTraversal(ast, decider);
    traversal.traverseEnterAndLeave(ast, typesVisited);

    typesVisited.stack.expectEmpty();
    [
      "Program",
      "ExportNamedDeclaration",
      "Identifier",
      "TSLiteralType",
      "Literal"
    ].forEach(type => {
      expect(typesVisited.spyEnter).toHaveBeenCalledWith(type);
      expect(typesVisited.spyLeave).toHaveBeenCalledWith(type);
    });

    expect(typesVisited.spyEnter).toHaveBeenCalledTimes(5);
    expect(typesVisited.spyLeave).toHaveBeenCalledTimes(5);
  });

  it("on reject, excludes the node and its descendants", () => {
    decider.runFilter(
      [AST_NODE_TYPES.TSLiteralType], true, Decision.Reject
    );
    decideRemainingAsAccept();

    traversal = new ESTreeTraversal(ast, decider);
    traversal.traverseEnterAndLeave(ast, typesVisited);

    typesVisited.stack.expectEmpty();
    [
      "Program",
      "ExportNamedDeclaration",
      "TSTypeAliasDeclaration",
      "Identifier",
    ].forEach(type => {
      expect(typesVisited.spyEnter).toHaveBeenCalledWith(type);
      expect(typesVisited.spyLeave).toHaveBeenCalledWith(type);
    });

    expect(typesVisited.spyEnter).toHaveBeenCalledTimes(4);
    expect(typesVisited.spyLeave).toHaveBeenCalledTimes(4);
  });

  it("on accept, but with the entry returning false, excludes descendants of the node", () => {
    /*
    decider.runFilter(
      [AST_NODE_TYPES.TSTypeAliasDeclaration], true, Decision.RejectChildren
    );
    */
    decideRemainingAsAccept();

    typesVisited.enter = function(n: TSNode) : boolean
    {
      typesVisited.spyEnter(n.type);
      typesVisited.stack.push(n);
      return n.type !== AST_NODE_TYPES.TSTypeAliasDeclaration;
    }

    traversal = new ESTreeTraversal(ast, decider);
    traversal.traverseEnterAndLeave(ast, typesVisited);

    typesVisited.stack.expectEmpty();

    [
      "Program",
      "ExportNamedDeclaration",
      "TSTypeAliasDeclaration",
    ].forEach(type => {
      expect(typesVisited.spyEnter).toHaveBeenCalledWith(type);
      expect(typesVisited.spyLeave).toHaveBeenCalledWith(type);
    });

    expect(typesVisited.spyEnter).toHaveBeenCalledTimes(3);
    expect(typesVisited.spyLeave).toHaveBeenCalledTimes(3);
  });

  it("throws in the constructor if the decider has some unassigned values", () => {
    decider.runFilter(
      [AST_NODE_TYPES.TSLiteralType], true, Decision.Reject
    );

    expect(
      () => traversal = new ESTreeTraversal(ast, decider)
    ).toThrowError("The decider must be fully resolved!");
  });

  it("stops iteration on an exception", () => {
    decideRemainingAsAccept();

    const exn = { exception: "stopIteration" };
    typesVisited.spyLeave.and.callFake((n: AST_NODE_TYPES) => {
      if (n === AST_NODE_TYPES.Identifier)
        throw exn;
    });

    traversal = new ESTreeTraversal(ast, decider);

    expect(
      () => traversal.traverseEnterAndLeave(ast, typesVisited)
    ).toThrow(exn);

    expect(typesVisited.stack.stack.map(n => n.type)).toEqual([
      AST_NODE_TYPES.TSTypeAliasDeclaration,
      AST_NODE_TYPES.ExportNamedDeclaration,
      AST_NODE_TYPES.Program,
    ]);

    [
      "Program",
      "ExportNamedDeclaration",
      "TSTypeAliasDeclaration",
      "Identifier",
    ].forEach(type => {
      expect(typesVisited.spyEnter).toHaveBeenCalledWith(type);
    });

    expect(typesVisited.spyEnter).toHaveBeenCalledTimes(4);
    expect(typesVisited.spyLeave).toHaveBeenCalledOnceWith("Identifier");
  });

  it("doesn't have to start at the root node", () => {
    decideRemainingAsAccept();
    traversal = new ESTreeTraversal(ast, decider);
    traversal.traverseEnterAndLeave(ast.body[0], typesVisited);

    typesVisited.stack.expectEmpty();
    [
      "ExportNamedDeclaration",
      "TSTypeAliasDeclaration",
      "Identifier",
      "TSLiteralType",
      "Literal"
    ].forEach(type => {
      expect(typesVisited.spyEnter).toHaveBeenCalledWith(type);
      expect(typesVisited.spyLeave).toHaveBeenCalledWith(type);
    });

    expect(typesVisited.spyEnter).toHaveBeenCalledTimes(5);
    expect(typesVisited.spyLeave).toHaveBeenCalledTimes(5);
  });
});
