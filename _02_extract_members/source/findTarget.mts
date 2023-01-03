/* There's a few basic steps:
(1) Drill down into the parameterRefs to find an identifier as a start point
(2) Assert the identifier points to a TypeAliasDeclaration or an InterfaceDeclaration
(3) Collect all the nodes for that identifier
(4) For each node:
  (a) Look up members by the indexed access
  (b) Match the type parameters of the node in parameterRefs
  (c) If it leads to a TypeReference, find the reference and restart the loop.
  (d) Assert we end up with an Interface or a TypeDeclaration.
(5) Resolve the type parameters.
*/

import ts from "ts-morph";

import * as AliasTypeBuilders from "../../_01_alias_type_builders/exports.mjs";
import {
  getAliasOrInterfacesById,
} from "./typeBuilders/Identifier.mjs";

import routeToTypeElementMembered, {
  type RouteSuccess,
  type RouteFailure
} from "./nodes/router.mjs";

import getInterfaceNodeArray from "./nodes/InterfaceDeclaration.mjs";

import ErrorWithCodeBlockWriter from "./typeBuilders/Error.mjs";

export type FindTargetResults = {
  memberTypes: ts.TypeElementTypes[]
  parameterRefs: WeakMap<
    ts.TypeNode,
    AliasTypeBuilders.TypePrinterInterface
  >;
}

const { PrinterKind } = AliasTypeBuilders;

export default function findTarget(
  sourceFile: ts.SourceFile,
  printer: AliasTypeBuilders.TypePrinterUnion
) : FindTargetResults
{
  if (printer.printerKind === PrinterKind.Identifier) {
    const routeResult = routeTargetById(sourceFile, printer);
    if (routeResult.status === "failure") {
      return ErrorWithCodeBlockWriter("failed to find type literal or interface: ", printer);
    }

    const memberTypes = getAllMembers(routeResult.node);
    return {
      memberTypes,
      parameterRefs: new WeakMap
    };
  }

  return ErrorWithCodeBlockWriter("printer kind not yet supported: ", printer);
}

export function routeTargetById(
  sourceFile: ts.SourceFile,
  ref: AliasTypeBuilders.Identifier
) : RouteSuccess | RouteFailure
{
  const aliasOrInterface = getAliasOrInterfacesById(sourceFile, ref);
  return routeToTypeElementMembered(aliasOrInterface);
}

function getAllMembers(
  node: ts.TypeLiteralNode | ts.InterfaceDeclaration
) : ts.TypeElementTypes[]
{
  if (ts.Node.isTypeLiteral(node))
    return node.getMembers();

  const interfaceNodes = getInterfaceNodeArray(node);
  return interfaceNodes.flatMap(interfaceNode => interfaceNode.getMembers());
}
