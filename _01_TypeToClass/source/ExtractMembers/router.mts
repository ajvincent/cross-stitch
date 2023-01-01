import ts from "ts-morph";
import {
  ChildListsResult,
} from "./childLists.mjs";

import TypeReferenceChildLists from "./TypeReference.mjs";
import UnknownTypeNodeLists from "./UnknownTypeNode.mjs";
import TypeMemberedNodeMembers from "./TypeMemberedNode.mjs";

export default function routeChildForLists(
  node: ts.TypeNode | ts.InterfaceDeclaration | ts.TypeAliasDeclaration
) : ChildListsResult
{
  if (ts.Node.isTypeAliasDeclaration(node))
    node = node.getTypeNodeOrThrow();

  // InterfaceDeclaration, TypeLiteral
  if (ts.Node.isTypeElementMembered(node))
    return TypeMemberedNodeMembers(node);

  if (ts.Node.isTypeReference(node))
    return TypeReferenceChildLists(node);

  return UnknownTypeNodeLists(node);
}
