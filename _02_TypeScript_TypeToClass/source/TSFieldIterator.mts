
import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

import DecideEnumTraversal, {
  Decision
} from "../../_01_TypeScript_ESTree/source/DecideEnumTraversal.mjs";
import type {
  TSNode_DiscriminatedCallbacks
} from "../../_01_TypeScript_ESTree/source/ESTreeEnterLeaveBase.mjs";
import ESTreeErrorUnregistered from "../../_01_TypeScript_ESTree/source/ESTreeErrorUnregistered.mjs";

import type { ClassSources } from "./ClassSources.mjs";
import type { SourceCode_AST_ScopeManager } from "./Driver.mjs";

type TSNode = TSESTree.TSESTree.Node;
type TSMethodSignature = TSESTree.TSESTree.TSMethodSignature;
type TSPropertySignature = TSESTree.TSESTree.TSPropertySignature;

export const TSFieldIteratorDecider = DecideEnumTraversal.buildTypeDecider();

TSFieldIteratorDecider.runFilter(
  [
    AST_NODE_TYPES.TSMethodSignature,
    AST_NODE_TYPES.TSPropertySignature,
  ],
  true,
  Decision.RejectChildren
);

TSFieldIteratorDecider.finalize(Decision.Skip);

type EnterFields = Pick<
  TSNode_DiscriminatedCallbacks,
  "enterTSMethodSignature" |
  "enterTSPropertySignature"
>;

export class TSFieldIterator
       extends ESTreeErrorUnregistered
       implements EnterFields
{
  #sourceCode: string;
  #classSources: ClassSources;

  #fieldsFound = new Set<string>;
  readonly fieldsFound: ReadonlySet<string>;

  #fieldsImplemented = new Set<string>;
  readonly fieldsImplemented: ReadonlySet<string>;

  constructor(
    parsedSource: SourceCode_AST_ScopeManager,
    classSources: ClassSources,
    userConsole?: Console
  )
  {
    super(userConsole);
    this.#sourceCode = parsedSource.sourceCode;
    this.#classSources = classSources;

    this.fieldsFound = this.#fieldsFound;
    this.fieldsImplemented = this.#fieldsImplemented;
  }

  enter(n: TSNode) : boolean
  {
    if (n.type === AST_NODE_TYPES.TSMethodSignature)
      return this.enterTSMethodSignature(n);
    if (n.type === AST_NODE_TYPES.TSPropertySignature)
      return this.enterTSPropertySignature(n);

    // we should never reach this point
    return super.enter(n);
  }

  enterTSMethodSignature(n: TSMethodSignature) : boolean
  {
    let signature = this.#sourceCode.substring(
      n.range[0],
      n.range[1]
    );
    signature = signature.replace(/;$/, "").trim();

    if (!("name" in n.key))
      throw new Error("assertion failure: expected n.key.name to be a string");

    const name = n.key.name;

    const added = this.#classSources.defineMethod(
      name,
      signature,
      n
    );
    this.#fieldsFound.add(name);
    if (added)
      this.#fieldsImplemented.add(name);

    return false;
  }

  enterTSPropertySignature(n: TSPropertySignature) : boolean
  {
    let signature = this.#sourceCode.substring(
      n.range[0],
      n.range[1]
    );
    signature = signature.replace(/;$/, "").trim();

    if (!("name" in n.key))
      throw new Error("assertion failure: expected n.key.name to be a string");

    const name = n.key.name;

    const added = this.#classSources.defineProperty(
      name,
      signature,
      n
    );
    this.#fieldsFound.add(name);
    if (added)
      this.#fieldsImplemented.add(name);

    return false;
  }
}
