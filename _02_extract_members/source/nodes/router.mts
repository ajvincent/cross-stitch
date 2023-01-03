import ts from "ts-morph";
import getFirstReferencedNode from "./TypeReference.mjs";

import type { InterfaceOrTypeAlias } from "../utilities.mjs";

export type RouteSuccess = {
  status: "success",
  node: ts.InterfaceDeclaration | ts.TypeLiteralNode;
}

export type RouteFailure = {
  status: "failure";
  node: ts.TypeNode;
}

type RouteContinue = {
  status: "continue";
  node: ts.TypeNode | InterfaceOrTypeAlias;
}

export default function routeToTypeElementMembered(
  node: ts.TypeNode | InterfaceOrTypeAlias
) : RouteSuccess | RouteFailure
{
  let routeResult: RouteSuccess | RouteFailure | RouteContinue = {
    status: "continue",
    node
  };

  while (routeResult.status === "continue") {
    routeResult = routeToTypeElementMemberedStep(routeResult.node);
  }

  return routeResult;
}

function routeToTypeElementMemberedStep(
  node: ts.TypeNode | InterfaceOrTypeAlias
) : RouteSuccess | RouteFailure | RouteContinue
{
  if (ts.Node.isTypeLiteral(node) ||
      ts.Node.isInterfaceDeclaration(node)) {
    return {
      status: "success",
      node
    };
  }

  if (ts.Node.isTypeAliasDeclaration(node)) {
    return {
      status: "continue",
      node: node.getTypeNodeOrThrow()
    };
  }

  if (ts.Node.isTypeReference(node)) {
    return {
      status: "continue",
      node: getFirstReferencedNode(node),
    }
  }

  return {
    status: "failure",
    node
  };
}
