import TSESTree from "@typescript-eslint/typescript-estree";
import type { Scope, ScopeManager } from "@typescript-eslint/scope-manager";

// TSNode is a union of many TSNode types, each with an unique "type" attribute
type TSNode = TSESTree.TSESTree.Node;
type TSProgram = TSESTree.TSESTree.Program;

import ESTreeErrorUnregistered from "./ESTreeErrorUnregistered.mjs";
import DecideEnumTraversal, { Decision } from "./DecideEnumTraversal.mjs";
import type { ASTAndScopeManager } from "./ESTreeParser.mjs";
import ESTreeTraversal from "./ESTreeTraversal.mjs";

import {
  DefaultWeakMap
} from "../../_00_shared_utilities/source/DefaultMap.mjs";

type NodeToScopeMapFull = DefaultWeakMap<TSNode, Scope | null>;
export type NodeToScopeMap = Pick<NodeToScopeMapFull, "get">;

const NodeToScopeDecision = DecideEnumTraversal.buildTypeDecider();
NodeToScopeDecision.finalize(Decision.Accept);

class NodeToScopeEnterLeave extends ESTreeErrorUnregistered
{
  #map: NodeToScopeMapFull;
  #scopeManager: ScopeManager;
  #currentScope: Scope | null = null;
  #scopeStack: (Scope | null)[] = [];

  constructor(
    map: NodeToScopeMapFull,
    scopeManager: ScopeManager,
  )
  {
    super();
    this.#map = map;
    this.#scopeManager = scopeManager;
  }

  enter(n: TSNode) : boolean
  {
    this.#scopeStack.unshift(this.#currentScope);

    const s = this.#scopeManager.acquire(n, true);
    if (s) {
      this.#currentScope = s;
    }

    this.#map.set(n, this.#currentScope);
    return true;
  }

  leave(n: TSNode) : void
  {
    void(n);
    this.#currentScope = this.#scopeStack.shift() as Scope | null;
  }
}

const ProgramToNodeScopeMap = new DefaultWeakMap<TSProgram, NodeToScopeMap>;

function buildNodeToScopeMap(astAndScopes: ASTAndScopeManager) : NodeToScopeMap
{
  const map: NodeToScopeMapFull = new DefaultWeakMap;
  const enterLeave = new NodeToScopeEnterLeave(map, astAndScopes.scopeManager);

  const traversal = new ESTreeTraversal(astAndScopes.ast, NodeToScopeDecision);
  traversal.traverseEnterAndLeave(astAndScopes.ast, enterLeave);

  return map;
}

export default function MapNodesToScopes(
  astAndScopes: ASTAndScopeManager
) : NodeToScopeMap
{
  return ProgramToNodeScopeMap.getDefault(
    astAndScopes.ast,
    () => buildNodeToScopeMap(astAndScopes)
  );
}
