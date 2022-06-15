import fs from "fs/promises";

import TSESTree from "@typescript-eslint/typescript-estree";

import {
  DefaultMap,
  DefaultWeakMap
} from "../../_00_shared_utilities/source/DefaultMap.mjs";

// TSNode is a union of many TSNode types, each with an unique "type" attribute
type TSNode = TSESTree.TSESTree.Node;

// #region callback type definitions
/**
 * {@link https://stackoverflow.com/questions/56981452/typescript-union-type-to-single-mapped-type}
 */
type TSNodeSelector<T extends TSNode["type"], U extends { type: TSNode["type"]}> =
  U extends { type: T } ? U : never;

type TSNode_EnterAndLeaveUnregistered =
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
abstract class ESTreeBase implements TSNode_EnterAndLeaveUnregistered
{
  static #fileCache: DefaultMap<string, Promise<string>> = new DefaultMap();
  static async #readFile(pathToFile: string): Promise<string>
  {
    return this.#fileCache.getDefault(
      pathToFile,
      () => fs.readFile(pathToFile, { encoding: "utf-8"})
    );
  }

  // #region constructor fields
  #pathToFile: string;
  constructor(pathToFile: string)
  {
    this.#pathToFile = pathToFile;
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

    this.#traverseJustEnter(ast);
    this.#traverseEnterAndLeave(ast);
  }
  // #endregion Parse file and start iteration

  // #region Tree traversal

  #traverseJustEnter(ast: TSNode) : void
  {
    // First pass: Fill parent-to-children mapping so we can recursively walk it for enter and leave
    TSESTree.simpleTraverse(
      ast, {
        enter: (node: TSNode, parent?: TSNode) : void =>
        {
          if (parent)
            this.#parentToChildren.getDefault(parent, () => []).push(node);
        }
      },
      true
    );
  }

  #parentToChildren: DefaultWeakMap<TSNode, TSNode[]> = new DefaultWeakMap;

  protected readonly skipTypes: ReadonlySet<TSESTree.AST_NODE_TYPES> = new Set;
  protected readonly rejectTypes: ReadonlySet<TSESTree.AST_NODE_TYPES> = new Set;
  protected readonly rejectChildrenTypes: ReadonlySet<TSESTree.AST_NODE_TYPES> = new Set;

  #traverseEnterAndLeave = (node: TSNode): void =>
  {
    if (this.rejectTypes.has(node.type))
      return;

    const mustSkip = this.skipTypes.has(node.type);

    let rejectChildren = this.rejectChildrenTypes.has(node.type);
    if (!mustSkip) {
      const acceptChildren = this.enter(node);
      rejectChildren ||= !acceptChildren;
    }

    if (!rejectChildren) {
      const children = this.#parentToChildren.get(node) ?? [];
      children.forEach(this.#traverseEnterAndLeave);
    }

    if (!mustSkip) {
      this.leave(node);
    }
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
  // #endregion Tree traversal
}
