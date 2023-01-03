import ts from "ts-morph";

import {
  type FieldNode,
} from "../source/childLists.mjs";

export default function matchTypeAndName(
  node: FieldNode,
  type: ts.SyntaxKind,
  name: string
) : void
{
  node.asKindOrThrow(type);
  expect(node.getName()).toBe(name);
}
