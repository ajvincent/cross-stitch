/**
 * This provides a base class for all traversal enter/leave traps.
 *
 * In particular, the enter and leave traps are overrideable, while the
 * unregisteredEnter and unregisteredLeave traps are abstract. Subclasses
 * should override .enter and .leave to call specific traps they define
 * (via implementing type-specific traps such as enterProgram() or
 * leaveTSTypeAliasDeclaration()), and use super.enter(), super.leave()
 * to fall back to the "unregistered" traps subclasses must implement.
 *
 * The ESTreeEnterLeaveBase class is abstract because it can't dictate
 * default behavior.
 *
 * The intent is for instances of this class to be reusable.  Therefore,
 * subclasses should implement a .clear() method, even if they do nothing.
 */

import TSESTree from "@typescript-eslint/typescript-estree";

type TSNode = TSESTree.TSESTree.Node;

import type { ESTreeEnterLeave } from "./ESTreeTraversal.mjs";

export type ESTreeUnregisteredEnterLeave =
{
  unregisteredEnter: (node: TSNode) => boolean;
  unregisteredLeave: (node: TSNode) => void;
}

export default
abstract class ESTreeEnterLeaveBase
         implements ESTreeEnterLeave, ESTreeUnregisteredEnterLeave
{
  /**
   * A traversal trap, called before possibly visiting a node's children.
   *
   * @param n - The current node.
   * @returns True if the traversal should visit children of the node, if the traversal's decision allows this.
   * @virtual
   */
  enter(n: TSNode) : boolean
  {
    return this.unregisteredEnter(n);
  }

  /**
   * A traversal trap, called after enter() and possibly visiting the node's children.
   * @param n - The current node.
   * @virtual
   */
  leave(n: TSNode) : void
  {
    return this.unregisteredLeave(n);
  }

  /**
   * Clear cached data, if there is any.
   * @virtual
   */
  clear() : void
  {
    // do nothing
  }

  /**
   * A default entry trap.
   * @param node - The current node.
   * @returns True if the traversal should visit children of the node.
   */
  abstract unregisteredEnter(node: TSNode) : boolean;

  /**
   * A default leave trap.
   * @param node - The current node.
   */
  abstract unregisteredLeave(node: TSNode) : void;
}


// #region callback type definitions
/**
 * {@link https://stackoverflow.com/questions/56981452/typescript-union-type-to-single-mapped-type}
 */
type TSNodeSelector<T extends TSNode["type"], U extends { type: TSNode["type"]}> =
  U extends { type: T } ? U : never;

/**
 * A discriminated union of methods:
 * enterProgram, enterTSTypeAliasDeclaration, ...
 * leaveProgram, leaveTSTypeAliasDeclaration, ...
 */
export type TSNode_DiscriminatedCallbacks = {
  /**
   * @returns True if the traversal should visit children of the node, if the traversal's decision allows this.
   */
  [t in TSNode["type"] as `enter${Capitalize<t>}`]: (n: TSNodeSelector<t, TSNode>) => boolean;
} & {
  [t in TSNode["type"] as `leave${Capitalize<t>}`]: (n: TSNodeSelector<t, TSNode>) => void;
};

// #endregion callback type definitions
