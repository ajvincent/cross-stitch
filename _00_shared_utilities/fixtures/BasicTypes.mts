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
export type unknownType = unknown;
export type voidType = void;

// this doesn't make immediate sense as a primitive, but whatever.
// maybe because it doesn't express properties.
export type anyObjectType = object;

export type unionOfStrings = "first string" | "second string";

export type stringNumberAndBoolean = [ string, number, boolean ];

enum OneTwoThree {
  one = 1,
  two,
  three,
}
export type OneTwoThreeType = OneTwoThree;

// Object type aliases
export type objectWithFooProperty = {
  fooObject: {
    foo: never;
  };
};
export type stringArray = string[];
export type voidFunction = () => void;

export type NumberStringType = {
  // typed so I can examine the type parameters
  repeatForward<S extends string>(s: S, n: number): string;
  repeatBack(n: number, s: string): string;
};

export type CallableType = {
  <Type extends string>(x: Type) : NumberStringType;
  (y: number) : null;
};

export type ConstructableType = {
  new<Type extends string>(x: Type) : NumberStringType;
  new (y: number) : null;
};

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

// indexed access type
export type FooExtracted = objectIntersectionType["fooObject"];

// parameterized types
export type GetterAndSetter<T extends number, U> = {
  get value(): T;
  set value(newValue: T);

  other: U;
};

export type GetterAndSetterString<T extends number> = GetterAndSetter<T, string>;

// resolving a type parameter
export type GetterAndSetterBoolean<T extends number> = GetterAndSetter<T, boolean>;

// keyof type, typeof type
// conditional type, mapped types, template literal type

// mapped type

type FooOrBar = "foo" | "bar";
export type FiniteProperties = {
  [key in FooOrBar]: objectIntersectionType[`${key}Object`];
};

export type ManyPropertiesMapped = {
  [key in keyof ManyProperties]: false;
};

// Index signatures.  These are poison for TypeToClass.

export type ManyProperties = {
  [key: string]: true;
};

export type ManyPropertiesWithRequired = {
  [key: string]: true;
  mustExist: true;
}

// aliases to aliases
export type oneStringTypeAlias = oneStringType;
export type objectWithFooPropertyAlias = objectWithFooProperty;

// #endregion type aliases

// #region Interfaces
export interface FooInterface {
  foo: true;
}

export interface FooInterface {
  foo2: true;
}

export interface BarInterface extends FooInterface
{
  bar: true;
}

export interface TwiceFooInterface extends FooInterface, BarInterface
{
}

interface ExtendedWop extends exportedWop, BarInterface
{
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

export type FooInterfaceAlias = FooInterface;

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
