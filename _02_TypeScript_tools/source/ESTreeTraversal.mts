import DecideEnumTraversal from "./DecideEnumTraversal.mjs";
import {
  DefaultWeakMap
} from "../../_00_shared_utilities/source/DefaultMap.mjs";

import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

// TSNode is a union of many TSNode types, each with an unique "type" attribute
type TSNode = TSESTree.TSESTree.Node;

type ParentToChildrenMap = Pick<WeakMap<TSNode, TSNode[]>, "get" | "has">;

export interface ESTreeEnterLeave {
  enter(n: TSNode) : boolean;
  leave(n: TSNode) : void;
}

export default class ESTreeTraversal
{
  // #region static private
  static #parentToChildrenMap: DefaultWeakMap<
    TSNode, ParentToChildrenMap
  > = new DefaultWeakMap;

  static #getParentToChildren(ast: TSNode) : ParentToChildrenMap
  {
    return this.#parentToChildrenMap.getDefault(ast, () => {
      const map: DefaultWeakMap<TSNode, TSNode[]> = new DefaultWeakMap;

      TSESTree.simpleTraverse(
        ast, {
          enter: (node: TSNode, parent?: TSNode) : void =>
          {
            if (parent)
              map.getDefault(parent, () => []).push(node);
          }
        },
        true
      );

      TSESTree.simpleTraverse(
        ast, {
          enter: (node: TSNode) : void =>
          {
            const children = map.get(node);
            if (children)
              Object.freeze(children);
          }
        }
      )

      return map;
    });
  }

  // #endregion static private

  // #region public API
  constructor(
    root: TSNode,
    decider: DecideEnumTraversal<TSNode["type"]>,
  )
  {
    if (root.type !== AST_NODE_TYPES.Program)
      throw new Error("The root must be a Program!");
    if (decider.remaining.length !== 0)
      throw new Error("The decider must be fully resolved!");
    this.#decider = decider;
    this.#observer = null;

    this.#parentToChildren = ESTreeTraversal.#getParentToChildren(root);
  }

  traverseEnterAndLeave(
    node: TSNode,
    observer: ESTreeEnterLeave
  ) : void
  {
    this.#observer = observer;
    try {
      this.#traverseEnterAndLeave(node);
    }
    finally {
      this.#observer = null;
    }
  }
  // #endregion public API

  // #region private fields

  #parentToChildren: ParentToChildrenMap;

  #decider: DecideEnumTraversal<TSNode["type"]>;
  #observer: ESTreeEnterLeave | null;

  #traverseEnterAndLeave = (
    node: TSNode
  ) : void =>
  {
    if (!this.#observer)
      throw new Error("assertion failure: we must have observer now");

    const decision = this.#decider.decisionMap.get(node.type);
    if (!decision)
      throw new Error("Unknown node type: " + node.type);

    if (decision === "Reject")
      return;

    const mustSkip = decision === "Skip";
    let rejectChildren = decision === "RejectChildren";

    if (!mustSkip) {
      rejectChildren = !this.#observer.enter(node) || rejectChildren;
    }

    if (!rejectChildren) {
      const children = this.#parentToChildren.get(node) ?? [];
      children.forEach(this.#traverseEnterAndLeave);
    }

    if (!mustSkip) {
      this.#observer.leave(node);
    }
  }

  // #endregion
}
