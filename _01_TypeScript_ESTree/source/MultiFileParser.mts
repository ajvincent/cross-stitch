// #region imports
import path from "path";
import fs from "fs/promises";
import url from "url";
import { createRequire } from 'module';

import ESTreeParser, { ASTAndScopeManager } from "./ESTreeParser.mjs";
import { NodeToScopeMap, MapNodesToScopes } from "./MapNodesToScopes.mjs";
import DecideEnumTraversal, { Decision } from "./DecideEnumTraversal.mjs";
import ESTreeTraversal from "./ESTreeTraversal.mjs";
import ESTreeErrorUnregistered from "./ESTreeErrorUnregistered.mjs";
import {
  DefaultMap
} from "../../_00_shared_utilities/source/DefaultMap.mjs";

import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

// #endregion imports

// TSNode is a union of many TSNode types, each with an unique "type" attribute
type TSNode = TSESTree.TSESTree.Node;
type TSTypeReference = TSESTree.TSESTree.TSTypeReference;
type ImportDeclaration = TSESTree.TSESTree.ImportDeclaration;

// #region getTypeNodesByIdentifier support
const TypeNodesByIdDecision = DecideEnumTraversal.buildTypeDecider();
TypeNodesByIdDecision.runFilter(
  [
    AST_NODE_TYPES.TSTypeAliasDeclaration,
    AST_NODE_TYPES.TSInterfaceDeclaration,
    AST_NODE_TYPES.ImportSpecifier,
  ],
  true,
  Decision.RejectChildren
);
TypeNodesByIdDecision.finalize(
  Decision.Skip
);

type IDToNodeSet = ReadonlyMap<string, TSNode[]>

/**
 * A helper to collect type declarations into an IDToNodeSet.
 * @see getTypeAliasesByIdentifier below.
 */
class TypeNodesToIdentifiers extends ESTreeErrorUnregistered
{
  readonly map = new DefaultMap<string, TSNode[]>;

  enter(n: TSNode) : boolean
  {
    if ((n.type === "TSTypeAliasDeclaration") ||
        (n.type === "TSInterfaceDeclaration"))
    {
      this.map.getDefault(n.id.name, () => []).push(n);
    }
    else if (n.type === "ImportSpecifier") {
      this.map.getDefault(n.local.name, () => []).push(n);
    }
    return true;
  }

  leave(n: TSNode) : void
  {
    void(n);
  }
}

// #endregion getTypeNodesByIdentifier support

// #region nodeToSourceLocation support
const NodeToSourceLocationDecision = DecideEnumTraversal.buildTypeDecider();
NodeToSourceLocationDecision.finalize(Decision.Accept);

/**
 * A helper to map every TSNode to the source file it came from.
 * Useful for importing types from other files.
 */
class NodeToSourceLocationEnterLeave extends ESTreeErrorUnregistered
{
  readonly #sourceLocation: string;
  readonly #nodeMap: WeakMap<TSNode, string>;

  /**
   * @param sourceLocation - The location of the TypeScript file.
   * @param nodeMap        - A shared WeakMap from MultiFileParser.
   * @see MultiFileParser.#nodeToSourceLocation
   */
  constructor(
    sourceLocation: string,
    nodeMap: WeakMap<TSNode, string>,
  )
  {
    super();
    this.#sourceLocation = sourceLocation;
    this.#nodeMap = nodeMap;
  }

  enter(n: TSNode) : boolean
  {
    this.#nodeMap.set(n, this.#sourceLocation);
    return true;
  }

  leave(n: TSNode): void
  {
    void(n);
  }
}

// #endregion nodeToSourceLocation support

export type SourceCode_AST_ScopeManager = {
  sourceLocation: string;
  sourceCode: string;
} & ASTAndScopeManager;

export default class MultiFileParser
{
  readonly #project: string;
  readonly #tsconfigRootDir: string;

  /**
   * 
   * @param project         - The project directory for TypeScript-ESLint's parser.
   * @param tsconfigRootDir - The TSConfig root directory for TypeScript-ESLint's parser.
   *
   * @see {@link https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/typescript-estree#parseandgenerateservicescode-options}
   */
  constructor(
    project: string,
    tsconfigRootDir: string,
  )
  {
    if (new.target !== MultiFileParser)
      throw new Error("Do not subclass MultiFileParser!");

    this.#project = project;
    this.#tsconfigRootDir = tsconfigRootDir;
  }

  // #region initial parsing of a module

  /**
   * Get the AST and scope manager for a module.
   * @param sourceLocation - The location of the module file.
   * @returns The parsed data.
   */
  async getSourcesAndAST(
    sourceLocation: string
  ) : Promise<SourceCode_AST_ScopeManager>
  {
    sourceLocation = path.normalize(path.resolve(
      process.cwd(), sourceLocation
    ));
    return this.#sourceAndAST_Promises.getDefault(
      sourceLocation,
      () => this.#parseFile(sourceLocation)
    );
  }

  #sourceAndAST_Promises: DefaultMap<
    string,
    Promise<SourceCode_AST_ScopeManager>
  > = new DefaultMap;

  #astToIdAndNodeSet = new WeakMap<
    TSESTree.TSESTree.Program,
    IDToNodeSet
  >;

  #nodeToSourceLocation = new WeakMap<TSNode, string>;

  /**
   * Get the AST and scope manager for a module.
   * @param sourceLocation - The location of the module file.
   * @returns The parsed data.
   */
  async #parseFile(
    sourceLocation: string
  ) : Promise<SourceCode_AST_ScopeManager>
  {
    const sourceCode = await fs.readFile(sourceLocation, { encoding: "utf-8" });

    const { ast, scopeManager } = ESTreeParser(sourceCode, {
      filePath: sourceLocation,
      project: this.#project,
      tsconfigRootDir: this.#tsconfigRootDir
    });

    MapNodesToScopes({ ast, scopeManager });

    { // map id's to nodes
      const enterLeave = new TypeNodesToIdentifiers;
      const traversal = new ESTreeTraversal(ast, TypeNodesByIdDecision);

      traversal.traverseEnterAndLeave(ast, enterLeave);
      this.#astToIdAndNodeSet.set(ast, enterLeave.map);
    }

    { // mark source location for nodes
      const enterLeave = new NodeToSourceLocationEnterLeave(
        sourceLocation,
        this.#nodeToSourceLocation
      );
      const traversal = new ESTreeTraversal(ast, NodeToSourceLocationDecision);
      traversal.traverseEnterAndLeave(ast, enterLeave);
    }

    return {
      sourceLocation,
      sourceCode,
      ast,
      scopeManager
    };
  }

  // #endregion initial parsing of a module

  /**
   * Get a list of type alias references by an identifier's name.
   * @param root - A program containing the id.
   * @param id   - The id to look up.
   * @returns The list of matching nodes, or undefined if there are none.
   */
  getTypeAliasesByIdentifier(
    root: TSESTree.TSESTree.Program,
    id: string
  ) : TSNode[] | undefined
  {
    return this.#astToIdAndNodeSet.get(root)?.get(id);
  }

  /**
   * Get the definitions for a particular type reference.
   * @param reference      - The type reference to look up.
   * @param resolveToFinal - True if we should look up `import from` modules.
   * @returns
   */
  async dereferenceIdentifier(
    reference: TSTypeReference,
    resolveToFinal: boolean
  ) : Promise<TSNode[]>
  {
    let scope = NodeToScopeMap.get(reference);
    if (!scope)
      throw new Error("Unknown reference node!");

    /* Route:
    1. Identifier name
    2. scope
    3. scope.set.get(name).defs
    4. ImportSpecifier and ImportDeclaration
    */

    // Identifier name
    const typeName = reference.typeName;
    if (typeName.type !== "Identifier")
    {
      // There's one other type, QualifiedName, I think.
      throw new Error("Unexpected typeName.type: " + typeName.type);
    }

    // Find the scope with this variable.
    while (!scope.set.has(typeName.name))
    {
      scope = scope.upper ?? undefined;
      if (!scope)
        throw new Error("Didn't find a scope for the desired type?");
    }

    // Variable definitions
    const Variable = scope.set.get(typeName.name);
    if (!Variable)
      throw new Error("No variable found?");
    let nodes: TSNode[] = Variable.defs.map(d => d.node) ?? [];

    // Import from another file, if we have to.
    if (resolveToFinal &&
        (nodes.length === 1) &&
        (nodes[0].type === "ImportSpecifier"))
    {
      const specifier = nodes[0];

      const decl = specifier.parent as ImportDeclaration;
      const importedLocation = await this.#resolveFileLocation(decl);

      const { ast: exportedAST } = await this.getSourcesAndAST(importedLocation);
      const exportedNodes = this.getTypeAliasesByIdentifier(
        exportedAST, specifier.imported.name
      );
      if (!exportedNodes)
        throw new Error("Couldn't get the exported nodes for " + importedLocation);
      nodes = exportedNodes;
    }

    return nodes;
  }

  /**
   * Try to find a TypeScript source file matching an import.
   * @param decl - The import declaration.
   * @returns The resolved location.
   */
  async #resolveFileLocation(decl: ImportDeclaration) : Promise<string>
  {
    const sourceLocation = this.#nodeToSourceLocation.get(decl) as string;
    const sourceURL = url.pathToFileURL(sourceLocation);
    const require = createRequire(sourceURL);
    const firstOption = require.resolve(decl.source.value);

    if (firstOption !== sourceLocation)
    {
      try {
        const candidate = firstOption.replace(/\.([A-Za-z]*)js$/, ".$1ts");
        await fs.stat(candidate);
        return candidate;
      }
      catch {
        // do nothing, this is normal
      }
    }

    // Think twice about resolving to @types/node or anywhere else...
    // After all, why would we want to build a class based on a type we don't own?

    throw new Error("no match found for resolving file location: " + sourceLocation);
  }
}

Object.freeze(MultiFileParser);
Object.freeze(MultiFileParser.prototype);
