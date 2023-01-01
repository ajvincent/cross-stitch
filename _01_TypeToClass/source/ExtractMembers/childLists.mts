import ts from "ts-morph";

export type FieldNode = (
  ts.MethodSignature |
  ts.PropertySignature |
  ts.GetAccessorDeclaration |
  ts.SetAccessorDeclaration
);

export type ChildListsResult = {
  fieldNodes: FieldNode[];

  unresolvedTypeNodes: ts.TypeNode[];

  indexSignatures: ts.IndexSignatureDeclaration[];

  mappedTypes: ts.MappedTypeNode[];

  constructorSignatures: ts.ConstructSignatureDeclaration[];

  callSignatures: ts.CallSignatureDeclaration[];
}

export interface ChildExtractor {
  getChildLists<T extends ts.TypeNode>(node: T) : ChildListsResult
}

export type getChildNodeList<
  T extends ts.TypeNode
> = (node: T) => ChildListsResult;

export function isFieldNode(
  node: ts.Node
) : node is FieldNode
{
  return node.isKind(ts.SyntaxKind.PropertySignature) ||
         node.isKind(ts.SyntaxKind.MethodSignature) ||
         node.isKind(ts.SyntaxKind.GetAccessor) ||
         node.isKind(ts.SyntaxKind.SetAccessor);
}
