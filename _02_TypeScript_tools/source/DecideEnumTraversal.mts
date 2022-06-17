export enum Decision {
  Accept = "Accept",
  RejectChildren = "RejectChildren",
  Skip = "Skip",
  Reject = "Reject"
}

/* The set is *finite*, and not overly large.  It'd be so much
   faster to just run the filter against every member of the set,
   and store determinate results in a ReadOnlyMap<T extends string, Decision>.
 */
type TypeFilter<T> = (s: T) => boolean;
type DecisionFilter<T extends string> = T[] | RegExp | TypeFilter<T>;

export default class DecideEnumTraversal<T extends string>
{
  readonly #map: Map<T, Decision> = new Map;
  readonly #setOfKeys: ReadonlySet<T>;

  readonly #pendingMap: Map<T, Decision> = new Map;
  #alreadyDefinedSet: T[] = [];

  // #region public API

  static readonly Decision = Object.freeze(Decision);
  readonly decisionMap: ReadonlyMap<T, Decision>;

  constructor(setOfKeys: ReadonlySet<T>)
  {
    this.#setOfKeys = new Set(setOfKeys);
    this.decisionMap = this.#map;
  }

  get remaining() : T[]
  {
    return Array.from(this.#setOfKeys).filter(
      key => !this.#map.has(key)
    );
  }

  runFilter(
    filter: DecisionFilter<T>, expects: boolean, result: Decision
  ) : T[]
  {
    this.#pendingMap.clear();
    this.#alreadyDefinedSet = [];

    if (filter instanceof RegExp)
    {
      this.#runRegExpFilter(filter, expects, result);
    }

    else if (filter instanceof Function)
    {
      this.#runFunctionFilter(filter, expects, result);
    }

    else {
      this.#runTypeFilter(filter, expects, result)
    }

    this.#pendingMap.forEach(
      (decision, key) => this.#map.set(key, decision)
    );
    return this.#alreadyDefinedSet.slice();
  }

  // #endregion public API

  // #region private methods

  #runRegExpFilter(
    filter: RegExp, expects: boolean, result: Decision
  ) : void
  {
    this.#setOfKeys.forEach(s => {
      if (filter.test(s) === expects)
        this.#maybeSet(s, result);
    });
  }

  #runFunctionFilter(
    filter: TypeFilter<T>, expects: boolean, result: Decision
  ) : void
  {
    const candidates: Set<T> = new Set;
    // this way, if the filter throws, we aren't in an inconsistent state.
    this.#setOfKeys.forEach(s => {
      if (filter(s) === expects)
        candidates.add(s);
    });

    candidates.forEach(s => this.#maybeSet(s, result));
  }

  #runTypeFilter(
    filter: T[], expects: boolean, result: Decision
  ) : void
  {
    const values = new Set(filter);
    this.#setOfKeys.forEach(s => {
      if (values.has(s) === expects)
        this.#maybeSet(s, result);
    });
  }

  #maybeSet(s: T, result: Decision) : void
  {
    const d = this.#map.get(s);
    if (!d)
      this.#pendingMap.set(s, result);
    else if (d !== result)
      this.#alreadyDefinedSet.push(s);
  }

  // #endregion private methods
}
