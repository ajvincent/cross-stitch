/**
 * This module exports a simple function for testing if a string is an Identifier.
 */

import ESTreeParser from "./ESTreeParser.mjs";
import DecideEnumTraversal, { Decision } from "./DecideEnumTraversal.mjs";
import ESTreeTraversal, { ESTreeEnterLeave} from "./ESTreeTraversal.mjs";

import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";
type TSNode = TSESTree.TSESTree.Node;

class IdentifierEnterLeave implements ESTreeEnterLeave
{
  #name: string
  constructor(s: string) {
    this.#name = s;
  }
  result = false;
  visited = false;
  enter(n: TSNode) : boolean
  {
    if (this.visited || (n.type !== AST_NODE_TYPES.Identifier))
      return false;

    this.visited = true;
    this.result = n.name === this.#name;
    return false;
  }

  leave(n: TSNode) : void
  {
    void(n);
  }
}

const IdentifierDecider = DecideEnumTraversal.buildTypeDecider();
IdentifierDecider.runFilter([AST_NODE_TYPES.Identifier], true, Decision.RejectChildren);
IdentifierDecider.finalize(Decision.Skip);

export default function IsIdentifier(s: string) : boolean
{
  try {
    const { ast } = ESTreeParser(`const ${s} = true;`);
    const traversal = new ESTreeTraversal(ast, IdentifierDecider);

    const enterLeave = new IdentifierEnterLeave(s);
    traversal.traverseEnterAndLeave(ast, enterLeave);
    return enterLeave.result;
  }
  catch (ex) {
    return false;
  }
}
