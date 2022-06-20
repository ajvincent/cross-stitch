/**
 * TSExportTypeExtractor exists to extract the one type the user wants to
 * create a stub class for.
 */

// #region prologue
import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

import DecideEnumTraversal, {
  Decision
} from "../../_01_TypeScript_ESTree/source/DecideEnumTraversal.mjs";
import type {
  TSNode_DiscriminatedCallbacks
} from "../../_01_TypeScript_ESTree/source/ESTreeEnterLeaveBase.mjs";
import ESTreeErrorUnregistered from "../../_01_TypeScript_ESTree/source/ESTreeErrorUnregistered.mjs";
import IsIdentifier from "../../_01_TypeScript_ESTree/source/IsIdentifier.mjs";

import type { TSTypeOrInterfaceDeclaration } from "./TSNode_types.mjs";

type TSNode = TSESTree.TSESTree.Node;
type ExportNamedDeclaration = TSESTree.TSESTree.ExportNamedDeclaration;
type TSTypeAliasDeclaration = TSESTree.TSESTree.TSTypeAliasDeclaration;
type TSInterfaceDeclaration = TSESTree.TSESTree.TSInterfaceDeclaration;
// #endregion prologue

// #region TSExportTypeFilterDecider
export const TSExportTypeFilterDecider = DecideEnumTraversal.buildTypeDecider();

TSExportTypeFilterDecider.runFilter(
  [AST_NODE_TYPES.ExportNamedDeclaration],
  true,
  Decision.Accept
);
TSExportTypeFilterDecider.runFilter(
  [
    AST_NODE_TYPES.TSTypeAliasDeclaration,
    AST_NODE_TYPES.TSInterfaceDeclaration,
  ],
  true,
  Decision.RejectChildren
);

TSExportTypeFilterDecider.finalize(Decision.Skip);
// #endregion TSExportTypeFilterDecider

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

  #typeNodes: Set<TSTypeOrInterfaceDeclaration> = new Set;
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

  /**
   * True if we've found an export of the type identifier.
   */
  get exportTypeFound() : boolean
  {
    return this.#exportTypeFound;
  }

  /**
   * All type nodes matching the identifier.
   */
  get typeNodes() : ReadonlySet<TSTypeOrInterfaceDeclaration>
  {
    return this.#typeNodes;
  }

  enter(n: TSNode) : boolean
  {
    if (n.type === AST_NODE_TYPES.ExportNamedDeclaration)
      return this.enterExportNamedDeclaration(n);
    if (n.type === AST_NODE_TYPES.TSTypeAliasDeclaration)
      return this.enterTSTypeAliasDeclaration(n);
    if (n.type === AST_NODE_TYPES.TSInterfaceDeclaration)
      return this.enterTSInterfaceDeclaration(n);

    // we should never reach this point
    return super.enter(n);
  }

  // #region enter traps

  /**
   * Match an export against our target type.
   * @param n - An export node.
   * @returns True if we should visit its children for a type alias or interface.
   */
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

  /**
   * If the type matches our desired name, add it to our set.
   *
   * @param n - The type declaration.
   * @returns True if the type declaration has the right name.
   */
  enterTSTypeAliasDeclaration(n: TSTypeAliasDeclaration) : false
  {
    if (this.#targetType === n.id.name)
      this.#typeNodes.add(n);
    return false;
  }

  /**
   * If the type matches our desired name, add it to our set.
   *
   * @param n - The type declaration.
   * @returns True if the type declaration has the right name.
   */
  enterTSInterfaceDeclaration(n: TSInterfaceDeclaration) : false
  {
    if (this.#targetType === n.id.name)
      this.#typeNodes.add(n);
    return false;
  }

  // #endregion enter traps

  leave(n: TSNode) : void
  {
    if (TSExportTypeExtractor.#acceptLeaveTypes.has(n.type))
      return;

    // we should never reach this point
    super.leave(n);
  }
}
