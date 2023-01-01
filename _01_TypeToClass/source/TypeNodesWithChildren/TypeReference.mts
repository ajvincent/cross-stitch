import ts from "ts-morph";
import {
  type getChildNodeList,
} from "./childLists.mjs";

import mergeChildLists from "./mergeChildLists.mjs";

const getReferencedNodes: getChildNodeList<ts.TypeReferenceNode> = (node) => {
  const identifier = node.getFirstChildIfKindOrThrow(
    ts.SyntaxKind.Identifier
  );

  const nodes: ts.TypeNode[] = identifier.getDefinitionNodes().map(n => {
    if (ts.Node.isTyped(n))
      return n.getTypeNodeOrThrow();
    throw new Error("assertion failure: non-typed node!");
  });

  return mergeChildLists(nodes);
}

export default getReferencedNodes;
