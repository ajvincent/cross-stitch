import ts from "ts-morph";
import {
  FieldNode,
  type ChildListsResult,
} from "./childLists.mjs";

import router from "./router.mjs";

export default function mergeChildLists(
  nodes: (ts.TypeNode | ts.InterfaceDeclaration)[]
) : ChildListsResult
{
  if (nodes.length === 1)
    return router(nodes[0]);

  const results = nodes.map(node => router(node));

  return {
    fieldNodes: flatUniqueMap<FieldNode>(
      results.map(result => result.fieldNodes)
    ),

    unresolvedTypeNodes: flatUniqueMap<ts.TypeNode>(
      results.map(result => result.unresolvedTypeNodes)
    ),

    indexSignatures: flatUniqueMap<ts.IndexSignatureDeclaration>(
      results.map(result => result.indexSignatures)
    ),

    mappedTypes: flatUniqueMap<ts.MappedTypeNode>(
      results.map(result => result.mappedTypes)
    ),

    constructorSignatures: flatUniqueMap<ts.ConstructSignatureDeclaration>(
      results.map(result => result.constructorSignatures)
    ),

    callSignatures: flatUniqueMap<ts.CallSignatureDeclaration>(
      results.map(result => result.callSignatures)
    ),
  };
}

/* I tried too hard to be clever and find a way to do flattening on the result array.
   I now realize all this would have done is made the code above unreadable.

   Plus, I couldn't get it to work...
*/
function flatUniqueMap<T extends ts.Node>(
  element_2dArray: T[][]
) : T[]
{
  return Array.from(new Set<T>(element_2dArray.flat()));
}
