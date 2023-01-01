import {
  type ChildListsResult,
} from "../source/TypeNodesWithChildren/childLists.mjs";

export default function onlyFieldNodes(results: ChildListsResult) : void
{
  expect(results.indexSignatures.length).toBe(0);
  expect(results.mappedTypes.length).toBe(0);
  expect(results.unresolvedTypeNodes.length).toBe(0);
  expect(results.constructorSignatures.length).toBe(0);
  expect(results.callSignatures.length).toBe(0);
}
