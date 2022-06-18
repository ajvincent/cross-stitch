import TSESTree from "@typescript-eslint/typescript-estree";

type TSNode = TSESTree.TSESTree.Node;

import { ESTreeEnterLeave } from "./ESTreeTraversal.mjs";

export type ESTreeUnregisteredEnterLeave =
{
  unregisteredEnter: (node: TSNode) => boolean;
  unregisteredLeave: (node: TSNode) => void;
}

// #region callback type definitions
/**
 * {@link https://stackoverflow.com/questions/56981452/typescript-union-type-to-single-mapped-type}
 */
type TSNodeSelector<T extends TSNode["type"], U extends { type: TSNode["type"]}> =
  U extends { type: T } ? U : never;

export type TSNode_DiscriminatedCallbacks = Partial<{
 [t in TSNode["type"] as `enter${Capitalize<t>}`]: (n: TSNodeSelector<t, TSNode>) => boolean;
} & {
 [t in TSNode["type"] as `leave${Capitalize<t>}`]: (n: TSNodeSelector<t, TSNode>) => void;
}>

// #endregion callback type definitions

export default
abstract class ESTreeEnterLeaveBase
         implements ESTreeEnterLeave, ESTreeUnregisteredEnterLeave
{
  enter(n: TSNode) : boolean
  {
    return this.unregisteredEnter(n);
  }

  leave(n: TSNode) : void
  {
    return this.unregisteredLeave(n);
  }

  abstract unregisteredEnter(node: TSNode): boolean;
  abstract unregisteredLeave(node: TSNode) : void;
}
