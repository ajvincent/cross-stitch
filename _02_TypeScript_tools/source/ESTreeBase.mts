import TSESTree, {AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

import DecideEnumTraversal from "./DecideEnumTraversal.mjs";
import ESTreeTraversal, { ESTreeEnterLeave } from "./ESTreeTraversal.mjs";

// TSNode is a union of many TSNode types, each with an unique "type" attribute
export type TSNode = TSESTree.TSESTree.Node;

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
abstract class ESTreeFile
         implements ESTreeEnterLeave, ESTreeUnregisteredEnterLeave
{
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
  #contents: string;
  #parseOptions = {
    errorOnUnknownASTType: false,
    loc: true,
    filePath: "",
    range: true
  };

  #decideEnumTraversal: DecideEnumTraversal<TSNode["type"]>;

  constructor(
    contents: string,
    decideEnumTraversal: DecideEnumTraversal<TSNode["type"]>
  )
  {
    this.#contents = contents;
    this.#decideEnumTraversal = decideEnumTraversal;
  }
  // #endregion constructor fields

  // #region Traversal

  protected setContentsAndFilePath(
    contents: string,
    pathToFile: string
  ) : void
  {
    this.#contents = contents;
    this.#parseOptions.filePath = pathToFile;
  }

  async run(): Promise<void>
  {
    const ast = TSESTree.parse(
      this.#contents,
      this.#parseOptions
    );

    const traversal = new ESTreeTraversal(
      ast,
      this.#decideEnumTraversal
    );

    traversal.traverseEnterAndLeave(ast, this);
  }

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

  // #endregion Traversal
}
