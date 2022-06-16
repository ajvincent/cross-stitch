import fs from "fs/promises";

import TSESTree, {AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

import DecideEnumTraversal from "./DecideEnumTraversal.mjs";
import ESTreeTraversal, { ESTreeEnterLeave } from "./ESTreeTraversal.mjs";
import {
  DefaultMap
} from "../../_00_shared_utilities/source/DefaultMap.mjs";

// TSNode is a union of many TSNode types, each with an unique "type" attribute
type TSNode = TSESTree.TSESTree.Node;

// #region callback type definitions
/**
 * {@link https://stackoverflow.com/questions/56981452/typescript-union-type-to-single-mapped-type}
 */
type TSNodeSelector<T extends TSNode["type"], U extends { type: TSNode["type"]}> =
  U extends { type: T } ? U : never;

type ESTreeUnregisteredEnterLeave =
{
  unregisteredEnter: (node: TSNode) => boolean;
  unregisteredLeave: (node: TSNode) => void;
}

export type TSNode_DiscriminatedCallbacks = Partial<{
  [t in TSNode["type"] as `enter${Capitalize<t>}`]: (n: TSNodeSelector<t, TSNode>) => boolean;
} & {
  [t in TSNode["type"] as `leave${Capitalize<t>}`]: (n: TSNodeSelector<t, TSNode>) => void;
}>

// #endregion callback type definitions

export default
abstract class ESTreeBase
         implements ESTreeEnterLeave, ESTreeUnregisteredEnterLeave
{
  static #fileCache: DefaultMap<string, Promise<string>> = new DefaultMap();
  static async #readFile(pathToFile: string): Promise<string>
  {
    return this.#fileCache.getDefault(
      pathToFile,
      () => fs.readFile(pathToFile, { encoding: "utf-8"})
    );
  }

  static buildTypeTraversal(): DecideEnumTraversal<TSNode["type"]>
  {
    const types: Set<TSNode["type"]> = new Set(
      Object.values(AST_NODE_TYPES)
    );
    return new DecideEnumTraversal<TSNode["type"]>(
      types
    );
  }

  // #region constructor fields
  #pathToFile: string;
  #stringTraversalDecision: DecideEnumTraversal<TSNode["type"]>;
  constructor(
    pathToFile: string,
    stringTraversalDecision: DecideEnumTraversal<TSNode["type"]>
  )
  {
    this.#pathToFile = pathToFile;
    this.#stringTraversalDecision = stringTraversalDecision;
  }
  // #endregion constructor fields

  // #region Parse file and start iteration
  async run(): Promise<void>
  {
    const sourceContents = await ESTreeBase.#readFile(this.#pathToFile);

    const ast = TSESTree.parse(
      sourceContents,
      {
        errorOnUnknownASTType: false,
        filePath: this.#pathToFile,
        loc: true,
        range: true
      }
    );

    const traversal = new ESTreeTraversal(
      ast,
      this.#stringTraversalDecision
    );

    traversal.traverseEnterAndLeave(ast, this);
  }
  // #endregion Parse file and start iteration

  // #region Tree traversal
  enter(n: TSNode) : boolean
  {
    return this.unregisteredEnter(n);
  }

  leave(n: TSNode) : void
  {
    return this.unregisteredLeave(n);
  }

  abstract unregisteredEnter(node: TSNode): boolean;
  abstract unregisteredLeave(node: TSESTree.TSESTree.Node) : void;
  // #endregion Tree traversal
}
