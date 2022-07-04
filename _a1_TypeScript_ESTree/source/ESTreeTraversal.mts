/**
 * This file implements the actual traversal I use.  It combines the AST from
 * ESTreeParser.mts with the decisions from DecideEnumTraversal, and the
 * ESTreeEnterLeave interface, to drive traversal of a tree of nodes.
 *
 * "So, you've reinvented estraverse."
 * @see {@link https://github.com/estools/estraverse/}
 *
 * I suppose so, unintentionally.  I like this design better for its
 * DecideEnumTraversal support, and the "RejectGrandchildren" feature
 * allows me to visit children but not grandchildren of a node.
 *
 * I still have to implement a "Break" capability, but I haven't needed it yet.
 */

import DecideEnumTraversal from "./DecideEnumTraversal.mjs";
import {
  DefaultWeakMap
} from "../../_00_shared_utilities/source/DefaultMap.mjs";

import TSESTree from "@typescript-eslint/typescript-estree";

// TSNode is a union of many TSNode types, each with an unique "type" attribute
type TSNode = TSESTree.TSESTree.Node;
type TSProgram = TSESTree.TSESTree.Program;

type ParentToChildrenMap = Pick<WeakMap<TSNode, TSNode[]>, "get">;

export interface ESTreeEnterLeave
{
  enter(n: TSNode) : boolean;
  leave(n: TSNode) : void;
}

export default class ESTreeTraversal
{
  // #region static private

  static #parentToChildrenMap: DefaultWeakMap<
    TSProgram, ParentToChildrenMap
  > = new DefaultWeakMap;

  /**
   * Provide a readonly WeakMap for traversal from each parent node to its children.
   * @param ast - The root node to traverse.  Usually a Program.
   * @returns The map.
   */
  static #getParentToChildren(ast: TSProgram) : ParentToChildrenMap
  {
    return this.#parentToChildrenMap.getDefault(ast, () => {
      const map: DefaultWeakMap<TSNode, TSNode[]> = new DefaultWeakMap;

      const parents: Set<TSNode> = new Set;

      TSESTree.simpleTraverse(
        ast, {
          enter: (node: TSNode, parent?: TSNode) : void =>
          {
            if (!parent)
              return;
            map.getDefault(parent, () => []).push(node);
            parents.add(parent);
          }
        },
        true
      );

      parents.forEach(parent => Object.freeze(map.get(parent)));

      return map;
    });
  }

  // #endregion static private

  // #region public API
  /**
   * @param root    - The root node
   * @param decider - A guide for visiting child nodes, calling enter/leave on current nodes.
   */
  constructor(
    root: TSProgram,
    decider: DecideEnumTraversal<TSNode["type"]>,
  )
  {
    if (decider.remaining.length !== 0)
      throw new Error("The decider must be fully resolved!");
    this.#decider = decider;
    this.#observer = null;

    this.#parentToChildren = ESTreeTraversal.#getParentToChildren(root);
  }

  /**
   * Begin traversal of a node and all its descendants.
   *
   * @param node     - The root to start traversing at.
   * @param observer - Enter / Leave callbacks.
   */
  traverseEnterAndLeave(
    node: TSNode,
    observer: ESTreeEnterLeave
  ) : void
  {
    if (this.#observer) {
      // By throwing, we'll probably end up exiting the parent traverseEnterAndLeave call as well...
      throw new Error("I'm in a traverseEnterAndLeave call now!");
    }

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
  #rejectGrandchildren = false;

  /**
   * Visit a node and/or its children, pending a traversal decision.
   * @param node - The node we're currently at.
   */
  #traverseEnterAndLeave = (
    node: TSNode
  ) : void =>
  {
    if (!this.#observer)
      throw new Error("assertion failure: we must have observer now");

    // "Accept", "Skip", "Reject", "RejectChildren"
    const decision = this.#decider.decisionMap.get(node.type);
    if (!decision)
      throw new Error("assertion failure: unknown node type: " + node.type);

    if (decision === "Reject")
      return;

    const mustSkip = decision === "Skip";
    let rejectChildren = (decision === "RejectChildren" || this.#rejectGrandchildren);

    // If the enter trap returns false, do not visit children.
    if (!mustSkip) {
      // decision === "Accept", "RejectChildren"
      rejectChildren = !this.#observer.enter(node) || rejectChildren;
    }

    if (!rejectChildren) {
      if (decision === "RejectGrandchildren")
        this.#rejectGrandchildren = true;

      // decision === "Accept" and enter trap returned true
      // decision === "RejectGrandchildren" and enter trap returned true
      // decision === "Skip"
      const children = this.#parentToChildren.get(node) ?? [];

      children.forEach(this.#traverseEnterAndLeave);

      if (decision === "RejectGrandchildren")
        this.#rejectGrandchildren = false;
    }

    if (!mustSkip) {
      // decision === "Accept", "RejectChildren"
      this.#observer.leave(node);
    }
  }

  // #endregion
}
