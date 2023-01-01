import ts from "ts-morph";
import {
  type ChildListsResult,
} from "./childLists.mjs";

import router from "./router.mjs";

export default function mergeChildLists(
  nodes: ts.TypeNode[]
) : ChildListsResult
{
  if (nodes.length === 1)
    return router(nodes[0]);

  const results = nodes.map(node => router(node));

  return {
    fieldNodes: results.flatMap(
      result => result.fieldNodes
    ),
    unresolvedTypeNodes: results.flatMap(
      result => result.unresolvedTypeNodes
    ),
    indexSignatures: results.flatMap(
      result => result.indexSignatures
    ),
    mappedTypes: results.flatMap(
      result => result.mappedTypes
    ),
    constructorSignatures: results.flatMap(
      result => result.constructorSignatures
    ),
    callSignatures: results.flatMap(
      result => result.callSignatures
    ),
  };
}
