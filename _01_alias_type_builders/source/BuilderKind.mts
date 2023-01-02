export enum BuilderKind {
  StringWrapper = 1000000,
  Root,
  Intersection,
  Union,
  IndexedAccess,
  TypeArgumented,
  KeyofTypeof,
  Tuple,
  TypeLiteral,
  MappedType,

  /** Don't use this outside of test specifications. */
  SPECS_ONLY = 1999999,
}
