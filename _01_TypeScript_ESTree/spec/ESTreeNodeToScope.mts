import MapNodesToScopes from "../source/MapNodesToScopes.mjs";
import ESTreeParser from "../source/ESTreeParser.mjs";
import TSESTree from "@typescript-eslint/typescript-estree";

type TSNode = TSESTree.TSESTree.Node;

it("MapNodesToScopes produces a non-global scope for each node", () =>
{
  const tsSource = `export type Foo = "Foo";\n`;
  const astAndScopes = ESTreeParser(tsSource);

  const nodeToScopeMap = MapNodesToScopes(astAndScopes);

  const allNodes: TSNode[] = [];
  TSESTree.simpleTraverse(astAndScopes.ast, {
    enter(node) {
      allNodes.push(node);
    }
  });

  allNodes.forEach((node, index) => {
    const scope = nodeToScopeMap.get(node);
    const expectation = expect(scope).withContext("node at index " + index);
    expectation.not.toBe(undefined);
    expectation.not.toBe(null);
    if (!scope)
      return;
    expect(scope.type).not.toBe("global");
  });
});
