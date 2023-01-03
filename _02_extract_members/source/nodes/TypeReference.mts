import ts from "ts-morph";

import type { InterfaceOrTypeAlias } from "../utilities.mjs";

export default function getFirstReferencedNode(
  node: ts.TypeReferenceNode
) : ts.TypeNode | InterfaceOrTypeAlias
{
  const identifier = node.getFirstChildIfKindOrThrow(
    ts.SyntaxKind.Identifier
  );

  const firstNode = identifier.getDefinitionNodes()[0];

  if (ts.Node.isTypeLiteral(firstNode) || ts.Node.isInterfaceDeclaration(firstNode))
    return firstNode;

  if (ts.Node.isTyped(firstNode))
    return firstNode.getTypeNodeOrThrow();

  throw new Error("assertion failure: non-typed node!");
}
