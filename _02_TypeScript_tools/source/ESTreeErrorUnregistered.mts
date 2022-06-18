import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

import ESTreeEnterLeaveBase from "./ESTreeEnterLeaveBase.mjs";
import { DefaultMap } from "../../_00_shared_utilities/source/DefaultMap.mjs";

type TSNode = TSESTree.TSESTree.Node;

type atStep = "enter" | "leave";
type Concat<A extends string, B extends string> = `${A}${B}`;

type trapName = Concat<atStep, Capitalize<AST_NODE_TYPES>>

export default class ESTreeErrorUnregistered extends ESTreeEnterLeaveBase
{
  #console?: Console;
  constructor(c?: Console)
  {
    super();
    this.#console = c;
  }

  #unregisteredNodes = new DefaultMap<trapName, Set<TSNode>>;

  #visitUnregistered(step: atStep, node: TSNode) : void
  {
    const set = this.#unregisteredNodes.getDefault(
      (step + node.type) as trapName, () => new Set
    );
    set.add(node);
  }

  unregisteredEnter(node: TSNode): boolean
  {
    this.#visitUnregistered("enter", node);
    return true;
  }

  unregisteredLeave(node: TSNode): void {
    this.#visitUnregistered("leave", node);
  }

  analyze() : void
  {
    if (this.#unregisteredNodes.size === 0)
      return;

    const traps = Array.from(this.#unregisteredNodes.keys());
    traps.sort();

    this.#console?.warn("Missing traps", traps);

    // eslint-disable-next-line no-debugger
    debugger;

    throw new Error("ESTreeErrorUnregistered.run() found traps you missed!");
  }
}
