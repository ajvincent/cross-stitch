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

class NodeToSourceLocationEnterLeave extends ESTreeErrorUnregistered
{
  readonly #sourceLocation: string;
  readonly #nodeMap: WeakMap<TSNode, string>;
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
  sourceCode: string;
  sourceLocation: string;
} & ASTAndScopeManager;

export default class MultiFileParser
{
  readonly #project: string;
  readonly #tsconfigRootDir: string;

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

    MapNodesToScopes({ ast, scopeManager});

    { // map id's to nodes
      const enterLeave = new TypeNodesToIdentifiers;
      const traversal = new ESTreeTraversal(ast, TypeNodesByIdDecision);

      traversal.traverseEnterAndLeave(ast, enterLeave);
      this.#astToIdAndNodeSet.set(ast, enterLeave.map);
    }

    { // mark sources for nodes
      const enterLeave = new NodeToSourceLocationEnterLeave(
        sourceLocation,
        this.#nodeToSourceLocation
      );
      const traversal = new ESTreeTraversal(ast, NodeToSourceLocationDecision);
      traversal.traverseEnterAndLeave(ast, enterLeave);
    }

    return { sourceCode, sourceLocation, ast, scopeManager };
  }

  getTypeAliasesByIdentifier(
    root: TSESTree.TSESTree.Program,
    id: string
  ) : TSNode[] | undefined
  {
    return this.#astToIdAndNodeSet.get(root)?.get(id);
  }

  async dereferenceVariable(
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

    const typeName = reference.typeName;
    if (typeName.type !== "Identifier")
    {
      throw new Error("Unexpected typeName.type: " + typeName.type);
    }

    while (!scope.set.has(typeName.name))
    {
      scope = scope.upper ?? undefined;
      if (!scope)
        throw new Error("Didn't find a scope for the desired type?");
    }

    const Variable = scope.set.get(typeName.name);
    if (!Variable)
      throw new Error("No variable found?");
    let nodes: TSNode[] = Variable.defs.map(d => d.node) ?? [];

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
