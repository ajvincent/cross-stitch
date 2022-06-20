import {
  AST_NODE_TYPES
} from "@typescript-eslint/typescript-estree";

/**
 * Decisions for traversal:
 * "Accept":         call the enter trap
 *                   visit children if the enter trap returns true
 *                   call the leave trap
 * "Skip":           visit children.
 * "Reject":         do nothing
 * "RejectChildren": visit the enter and leave traps.
 */
export enum Decision {
  Accept = "Accept",
  RejectChildren = "RejectChildren",
  Skip = "Skip",
  Reject = "Reject"
}
Object.freeze(Decision);

type TypeFilter<T extends string> = (s: T) => boolean;
type DecisionFilter<T extends string> = ReadonlyArray<T> | RegExp | TypeFilter<T>;

/* The set is *finite*, and not overly large.  It'd be so much
   faster to just run the filter against every member of the set,
   and store determinate results in a ReadOnlyMap<T extends string, Decision>.
 */

export default class DecideEnumTraversal<T extends string>
{
  // #region private properties
  /**
   * The list of committed decisions.
   */
  readonly #map: Map<T, Decision> = new Map;

  /**
   * The list of all keys.
   */
  readonly #setOfKeys: ReadonlySet<T>;

  /**
   * Decisions not yet committed.  I don't commit directly to #map because a
   * Function filter might throw an exception, which would leave us in an
   * inconsistent state.
   */
  readonly #pendingMap: Map<T, Decision> = new Map;

  /**
   * Types for which there was a different decision already.
   */
  #conflictingDecisions: T[] = [];

  /**
   * A reference set for ESTree node types.
   */
  static readonly #AST_NODE_TYPE_SET: ReadonlySet<AST_NODE_TYPES> = new Set(
    Object.values(AST_NODE_TYPES)
  );
  // #endregion private properties

  // #region public API

  static readonly Decision = Decision;

  /**
   * A read-only interface to the map of decisions.
   */
  readonly decisionMap: ReadonlyMap<T, Decision>;

  /**
   * @param setOfKeys - The set of all keys, which I clone.
   */
  constructor(setOfKeys: ReadonlySet<T>)
  {
    if (new.target !== DecideEnumTraversal)
      throw new Error("Why do you want to subclass this?");

    this.#setOfKeys = new Set(setOfKeys);
    this.decisionMap = this.#map;
  }

  /**
   * The remaining keys not having a decision yet.
   */
  get remaining() : T[]
  {
    return Array.from(this.#setOfKeys).filter(
      key => !this.#map.has(key)
    );
  }

  /**
   * Apply a decision to a subset of the keys.
   *
   * @param filter     - How we choose the subset.
   * @param isPositive - True if we should include matching keys, false if we should include non-matching keys.
   * @param result     - The decision to apply.
   * @returns The list of keys for which there's a conflicting decision in place.
   */
  runFilter(
    filter: DecisionFilter<T>, isPositive: boolean, result: Decision
  ) : T[]
  {
    this.#pendingMap.clear();
    this.#conflictingDecisions = [];

    if (filter instanceof RegExp)
    {
      this.#runRegExpFilter(filter, isPositive, result);
    }

    else if (filter instanceof Function)
    {
      this.#runFunctionFilter(filter, isPositive, result);
    }

    else {
      this.#runTypeFilter(filter, isPositive, result)
    }

    // Commit our changes, since the filter didn't throw.
    this.#pendingMap.forEach(
      (decision, key) => this.#map.set(key, decision)
    );

    // Clean up.
    const rv = this.#conflictingDecisions;
    this.#conflictingDecisions = [];
    this.#pendingMap.clear();
    return rv;
  }

  /**
   * Apply a final decision to any remaining keys.
   * @param result - The decision.
   */
  finalize(
    result: Decision
  ) : void
  {
    const remainingKeys = this.remaining;
    remainingKeys.forEach(key => this.#map.set(key, result));
  }

  /**
   * Build an ESTree type decider.
   * @returns The new decider.
   */
  static buildTypeDecider(): DecideEnumTraversal<AST_NODE_TYPES>
  {
    return new DecideEnumTraversal<AST_NODE_TYPES>(
      this.#AST_NODE_TYPE_SET
    );
  }

  // #endregion public API

  // #region private methods

  #runRegExpFilter(
    filter: RegExp, isPositive: boolean, result: Decision
  ) : void
  {
    this.#setOfKeys.forEach(s => {
      if (filter.test(s) === isPositive)
        this.#maybeSet(s, result);
    });
  }

  #runFunctionFilter(
    filter: TypeFilter<T>, isPositive: boolean, result: Decision
  ) : void
  {
    const candidates: Set<T> = new Set;
    // this way, if the filter throws, we aren't in an inconsistent state.
    this.#setOfKeys.forEach(s => {
      if (filter(s) === isPositive)
        candidates.add(s);
    });

    candidates.forEach(s => this.#maybeSet(s, result));
  }

  #runTypeFilter(
    filter: ReadonlyArray<T>, isPositive: boolean, result: Decision
  ) : void
  {
    const values = new Set(filter);
    this.#setOfKeys.forEach(s => {
      if (values.has(s) === isPositive)
        this.#maybeSet(s, result);
    });
  }

  #maybeSet(s: T, result: Decision) : void
  {
    const d = this.#map.get(s);
    if (!d)
      this.#pendingMap.set(s, result);
    else if (d !== result)
      this.#conflictingDecisions.push(s);
  }

  // #endregion private methods
}

Object.freeze(DecideEnumTraversal);
Object.freeze(DecideEnumTraversal.prototype);
