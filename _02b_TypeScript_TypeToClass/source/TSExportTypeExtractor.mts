import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

import DecideEnumTraversal, {
  Decision
} from "../../_02a_TypeScript_ESTree/source/DecideEnumTraversal.mjs";
import type {
  TSNode_DiscriminatedCallbacks
} from "../../_02a_TypeScript_ESTree/source/ESTreeEnterLeaveBase.mjs";
import ESTreeErrorUnregistered from "../../_02a_TypeScript_ESTree/source/ESTreeErrorUnregistered.mjs";
import IsIdentifier from "../../_02a_TypeScript_ESTree/source/IsIdentifier.mjs";

type TSNode = TSESTree.TSESTree.Node;
type ExportNamedDeclaration = TSESTree.TSESTree.ExportNamedDeclaration;
type TSTypeAliasDeclaration = TSESTree.TSESTree.TSTypeAliasDeclaration;
type TSInterfaceDeclaration = TSESTree.TSESTree.TSInterfaceDeclaration;

// #region TSExportTypeFilter
export const TSExportTypeFilterDecider = DecideEnumTraversal.buildTypeTraversal();

TSExportTypeFilterDecider.runFilter([
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.TSTypeAliasDeclaration,
  AST_NODE_TYPES.TSInterfaceDeclaration,
], true, Decision.Accept);

TSExportTypeFilterDecider.runFilter(
  (t: AST_NODE_TYPES) => {
    void(t);
    return true
  },
  true,
  Decision.Skip
);

type EnterExportTypeAndInterface = Pick<
  TSNode_DiscriminatedCallbacks,
  "enterExportNamedDeclaration" |
  "enterTSTypeAliasDeclaration" |
  "enterTSInterfaceDeclaration"
>;

export class TSExportTypeExtractor
       extends ESTreeErrorUnregistered
       implements EnterExportTypeAndInterface
{
  #targetType: string;

  #typeNodes: Set<
    TSTypeAliasDeclaration |
    TSInterfaceDeclaration
  > = new Set;
  #exportTypeFound = false;

  constructor(
    targetType: string,
    c?: Console
  )
  {
    super(c);
    if (!IsIdentifier(targetType))
      throw new Error(`Type: ${targetType} is not an identifier!`);
    this.#targetType = targetType;
  }

  static readonly #acceptLeaveTypes: ReadonlySet<AST_NODE_TYPES> = new Set([
    AST_NODE_TYPES.ExportNamedDeclaration,
    AST_NODE_TYPES.TSTypeAliasDeclaration,
    AST_NODE_TYPES.TSInterfaceDeclaration,
  ]);

  enter(n: TSNode) : boolean
  {
    if (n.type === AST_NODE_TYPES.ExportNamedDeclaration)
      return this.enterExportNamedDeclaration(n);
    if (n.type === AST_NODE_TYPES.TSTypeAliasDeclaration)
      return this.enterTSTypeAliasDeclaration(n);
    if (n.type === AST_NODE_TYPES.TSInterfaceDeclaration)
      return this.enterTSInterfaceDeclaration(n);
    return super.enter(n);
  }

  enterExportNamedDeclaration(n: ExportNamedDeclaration) : boolean
  {
    let result: boolean;

    if (n.declaration) { // n.exportKind === "type";
      if (n.declaration.type === AST_NODE_TYPES.VariableDeclaration)
        return false;
      const id = n.declaration.id;
      if (id?.type === AST_NODE_TYPES.Literal)
        return false;

      result = id?.name === this.#targetType;
    }
    else { // n.exportKind === "value"
      result = n.specifiers.some(
        specifier => specifier.exported.name === this.#targetType
      );
    }

    this.#exportTypeFound = result;
    return result;
  }

  enterTSTypeAliasDeclaration(n: TSTypeAliasDeclaration) : boolean
  {
    const result = this.#targetType === n.id.name;
    if (result)
      this.#typeNodes.add(n);
    return result;
  }

  enterTSInterfaceDeclaration(n: TSInterfaceDeclaration) : boolean
  {
    const result = this.#targetType === n.id.name;
    if (result)
      this.#typeNodes.add(n);
    return result;
  }

  leave(n: TSNode) : void
  {
    if (!TSExportTypeExtractor.#acceptLeaveTypes.has(n.type))
      super.leave(n);
  }

  get exportTypeFound() : boolean
  {
    return this.#exportTypeFound;
  }

  get typeNodes() : ReadonlySet<
    TSTypeAliasDeclaration |
    TSInterfaceDeclaration
  >
  {
    return this.#typeNodes;
  }
}

// #endregion TSExportTypeFilter


/*
export interface TSTypeToClassHandler {

};

type TSToMethodType = (
  identifier: string,
  typedArguments: TSNode[],
  returnType: TSNode
) => string;
*/
