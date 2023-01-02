import ts from "ts-morph";
import {
  isFieldNode,
  type FieldNode,
  type ChildListsResult,
} from "./childLists.mjs";

export default function getMembersList(
  node: ts.TypeElementMemberedNode
) : ChildListsResult
{
  const fieldNodes: FieldNode[] = [],
    unresolvedTypeNodes: ChildListsResult["unresolvedTypeNodes"] = [],
    mappedTypeNodes: ts.MappedTypeNode[] = [],
    indexSignatureNodes: ts.IndexSignatureDeclaration[] = [],
    constructorSignatures: ts.ConstructSignatureDeclaration[] = [],
    callSignatures: ts.CallSignatureDeclaration[] = [];

  node.getMembers().forEach(member => {
    if (isFieldNode(member))
      fieldNodes.push(member);
    else if (ts.TypeNode.isIndexSignatureDeclaration(member))
      indexSignatureNodes.push(member);
    else if (ts.TypeNode.isMappedTypeNode(member))
      mappedTypeNodes.push(member);
    else if (ts.TypeNode.isConstructSignatureDeclaration(member))
      constructorSignatures.push(member);
    else if (ts.TypeNode.isCallSignatureDeclaration(member))
      callSignatures.push(member);
    else
      unresolvedTypeNodes.push(member);
  });

  return {
    fieldNodes,
    unresolvedTypeNodes,
    mappedTypes: mappedTypeNodes,
    indexSignatures: indexSignatureNodes,
    constructorSignatures,
    callSignatures,
  };
}
