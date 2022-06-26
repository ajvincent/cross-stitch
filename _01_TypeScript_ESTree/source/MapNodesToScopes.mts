import TSESTree from "@typescript-eslint/typescript-estree";
import type { Scope, ScopeManager } from "@typescript-eslint/scope-manager";

// TSNode is a union of many TSNode types, each with an unique "type" attribute
type TSNode = TSESTree.TSESTree.Node;

import ESTreeErrorUnregistered from "./ESTreeErrorUnregistered.mjs";
import DecideEnumTraversal, { Decision } from "./DecideEnumTraversal.mjs";
import type { ASTAndScopeManager } from "./ESTreeParser.mjs";
import ESTreeTraversal from "./ESTreeTraversal.mjs";

export const NodeToScopeMap = new WeakMap<TSNode, Scope>;

const NodeToScopeDecision = DecideEnumTraversal.buildTypeDecider();
NodeToScopeDecision.finalize(Decision.Accept);

class NodeToScopeEnterLeave extends ESTreeErrorUnregistered
{
  #scopeManager: ScopeManager;
  #currentScope: Scope | null = null;
  #scopeStack: (Scope | null)[] = [];

  constructor(
    scopeManager: ScopeManager,
  )
  {
    super();
    this.#scopeManager = scopeManager;
  }

  enter(n: TSNode) : boolean
  {
    this.#scopeStack.unshift(this.#currentScope);

    const s = this.#scopeManager.acquire(n, true);
    if (s) {
      this.#currentScope = s;
    }

    NodeToScopeMap.set(n, this.#currentScope as Scope);
    return true;
  }

  leave(n: TSNode) : void
  {
    void(n);
    this.#currentScope = this.#scopeStack.shift() as Scope | null;
  }
}

export function MapNodesToScopes(
  astAndScopes: ASTAndScopeManager
) : void
{
  if (NodeToScopeMap.has(astAndScopes.ast))
    return;

  const enterLeave = new NodeToScopeEnterLeave(astAndScopes.scopeManager);

  const traversal = new ESTreeTraversal(astAndScopes.ast, NodeToScopeDecision);
  traversal.traverseEnterAndLeave(astAndScopes.ast, enterLeave);
}
