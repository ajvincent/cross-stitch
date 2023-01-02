export enum BuilderKind {
  StringWrapper = 1000000,
  Root,
  Intersection,
  Union,
  IndexedAccess,
  TypeParametered,
  KeyofTypeof,
  Tuple,
  TypeLiteral,
  MappedType,

  /** Don't use this outside of test specifications. */
  SPECS_ONLY = 1999999,
}
