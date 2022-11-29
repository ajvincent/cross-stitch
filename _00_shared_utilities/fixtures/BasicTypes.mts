// Imported types
import type {
  exportedOne,
  exportedBar,
  exportedWop,
} from "./ExportedTypes.mjs";

{
  const tOne: exportedOne = 1;
  void(tOne);

  const tBar: exportedBar = { bar: true };
  void(tBar);
}

// #region type aliases

// Primitive type aliases
export type oneStringType = "one string";
export type oneNumberType = 12;
export type trueBooleanType = true;
export type falseBooleanType = false;
export type anyStringType = string;
export type anyNumberType = number;
export type anyBooleanType = boolean;
export type anySymbolType = symbol;
export type undefinedType = undefined;
export type nullType = null;
export type neverType = never;
export type anyType = any;
export type unknownType = unknown;
export type voidType = void;

// this doesn't make immediate sense as a primitive, but whatever.
// maybe because it doesn't express properties.
export type anyObjectType = object;

export type unionOfStrings = "first string" | "second string";

enum OneTwoThree {
  one = 1,
  two,
  three,
};
export type OneTwoThreeType = OneTwoThree;

// Object type aliases
export type emptyObjectType = {};
export type objectWithFooProperty = {
  fooObject: never;
};
export type stringArray = string[];
export type voidFunction = () => void;

// intersections and unions
/* not exported */ type objectWithBarProperty = {
  barObject: unknown;
};
export type objectIntersectionType = objectWithFooProperty & objectWithBarProperty;
export type objectUnionType = objectWithFooProperty | objectWithBarProperty;

export type objectNumberUnion = objectWithFooProperty | 3;

// symbol key
export const SymbolTypeKey = Symbol("type");
type TypeHasSymbolKey = {
  [SymbolTypeKey]: boolean;
  "[SymbolTypeKey]": boolean;
};
{
  const s: TypeHasSymbolKey = {
    [SymbolTypeKey]: true,
    "[SymbolTypeKey]": false,
  };
  void(s);
}

// indexed types
type FooExtracted = objectIntersectionType["fooObject"];

// parameterized types

// keyof type, typeof type, indexed access type,
// conditional type, mapped types, template literal type

// aliases to aliases
type oneStringTypeAlias = oneStringType;
type objectWithFooPropertyAlias = objectWithFooProperty;

// #endregion type aliases

// #region Interfaces
export interface FooInterface {
  foo: true;
}

export interface FooInterface {
  foo2: true;
}

interface ExtendedWop extends exportedWop, FooInterface
{
  bar: true;
}

interface EmptyInterface {};
{
  const empty: EmptyInterface = {};
  void(empty);
}

{
  const Wop: ExtendedWop = {
    foo: true,
    foo2: true,
    bar: true,
    wop: true,
  };
  void(Wop);
}

type FooInterfaceAlias = FooInterface;

// Indexed and Mapped interfaces

// #endregion Interfaces

// Scoping
{
  type myString = "foo";
  const x: myString = "foo";
  void(x);
}

// types not defined in order
type SandwichHead = {
  head: true;
}
type FullSandwich = SandwichHead & SandwichTail;
type SandwichTail = {
  tail: true;
}
{
  const sandwich: FullSandwich = { head: true, tail: true };
  void(sandwich);
}
