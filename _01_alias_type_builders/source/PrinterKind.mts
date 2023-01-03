/**
 * @remarks
 * The goal is to build a TypeAliasStructure to reference an existing type alias in another file.
 * Therefore, this is explicitly a _partial_ list of printer kinds we support.
 *
 * Building out a TypeElementMemberedNodeStructure is a definite non-goal of this.
 */
export enum PrinterKind {
  /** Literals, keywords, strings. Catch-all for when everything else fails. */
  StringWrapper = 1000000,

  // I'm not sure if I need this.
  Root,

  // I'm not sure if I need this.
  Intersection,

  /** Useful for `Pick<foo, "bar" | "wop">`. */
  Union,

  /** Useful for picking out one member of a type. */
  IndexedAccess,

  /** Useful for parameterized types. */
  TypeArgumented,

  /*
  I implemented this before I really thought out whether I would need it or not.
  I'm still not sure if I do.

  This might be useful in `Pick<foo, keyof bar>`.
  */
  KeyofTypeof,

  // not implemented, give me a need for it
  Tuple,
  // not implemented, give me a need for it
  TypeLiteral,
  // not implemented, give me a need for it
  MappedType,

  /** Late addition */
  Identifier,

  /** Don't use this outside of test specifications. */
  SPECS_ONLY = 1999999,
}
