import { Node as TSNode, AST_NODE_TYPES } from "@typescript-eslint/types/dist/generated/ast-spec.js";
import DecideEnumTraversal from "./DecideEnumTraversal.mjs";
import ESTreeBase from "./ESTreeBase.mjs";

export default class ESTreeLogger extends ESTreeBase
{
  #console: Console;
  #counter = 0;

  constructor(pathToFile: string, c: Console = console)
  {
    const decider = ESTreeBase.buildTypeTraversal();
    decider.runFilter(
      (s) => {
        void(s);
        return true;
      },
      true,
      DecideEnumTraversal.Decision.Accept
    );

    super(pathToFile, decider);
    this.#console = c;
  }

  enter(node: TSNode) : boolean
  {
    if (node.type === AST_NODE_TYPES.Identifier)
      return this.unregisteredEnter(node, ` name="${node.name}"`);
    return super.enter(node);
  }

  leave(node: TSNode) : void
  {
    if (node.type === AST_NODE_TYPES.Identifier)
      return this.unregisteredLeave(node, ` name="${node.name}"`);
    return super.leave(node);
  }

  unregisteredEnter(node: TSNode, postfix = ""): boolean
  {
    this.#console.log(`${"  ".repeat(this.#counter)}enter ${node.type}${postfix}`);
    this.#counter++;
    return true;
  }

  unregisteredLeave(node: TSNode, postfix = ""): void
  {
    this.#counter--;
    this.#console.log(`${"  ".repeat(this.#counter)}leave ${node.type}${postfix}`);
  }
}
