import ts from "ts-morph";

import {
  type FieldNode,
} from "../source/TypeNodesWithChildren/childLists.mjs";

export default function matchTypeAndName(
  node: FieldNode,
  type: ts.SyntaxKind,
  name: string
) : void
{
  node.asKindOrThrow(type);
  expect(node.getName()).toBe(name);
}
