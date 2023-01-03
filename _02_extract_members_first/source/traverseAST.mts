import ts from "ts-morph";

import {
  type ChildListsResult,
} from "./childLists.mjs";
import routeChildForLists from "./router.mjs";
import mergeChildLists from "./mergeChildLists.mjs";

import { DefaultWeakMap } from "../../_00_shared_utilities/source/DefaultMap.mjs";

const ExportedTypes = new DefaultWeakMap<ts.SourceFile, Set<ts.Type>>;

type TraversalResult = [true, ChildListsResult] | [false, undefined];

export default function traverseAST(
  node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration
) : TraversalResult
{
  if (!hasExport(node))
    return [false, undefined];

  if (ts.Node.isTypeAliasDeclaration(node))
    return [true, routeChildForLists(node)];

  const interfaceArray = node.getSymbolOrThrow().getDeclarations();
  if (!isInterfaceArray(interfaceArray))
    throw new Error("assertion failure: we should get only interface declarations");

  return [true, mergeChildLists(interfaceArray)];
}

function hasExport(
  node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration
) : boolean
{
  const sourceFile = node.getSourceFile();
  const set = ExportedTypes.getDefault(sourceFile, () => {
    return new Set(sourceFile.getExportSymbols().map(s => s.getDeclaredType()))
  });
  return set.has(node.getType());
}

function isInterfaceArray(nodes: ts.Node[]) : nodes is ts.InterfaceDeclaration[]
{
  return (
    (nodes.length > 1) &&
    nodes.every(node => ts.Node.isInterfaceDeclaration(node))
  );
}
