// #region PassThroughType type

import type {
  AnyFunction,
  PropertyKey,
} from "./Common.mjs";

export const PassThroughSymbol = Symbol("Indeterminate return");

/*
  It's very tempting to try saying:
  type PassThroughType<
    ClassType extends AnyFunction, Key extends OnlyFunctionKeys<ClassType>
  > = {
    modifiedArguments: Parameters<ClassType[Key]>
    // ...
  };

  This *cannot work*, because Key is not restricted to one property.  It's
  technically a union of properties at the type definition level.  It can have
  any positive number of elements for Key.

  That's why I keep getting "Type 'Key' cannot be used to index type 'ClassType'. ts(2536)" errors.
*/
/**
 * @see KeyToComponentMap_Base.mts for implementation of PassThroughType, in PassThroughArgument.
 */
export type PassThroughType<MethodType extends AnyFunction> =
{
  // This marks the type as unique.
  [PassThroughSymbol]: boolean;

  // We can replace the arguments from one step to the next, using modifiedArguments.
  modifiedArguments: Parameters<MethodType>;

  // This allows us to call another method with the modifiedArguments.
  // ReturnOrPassThroughType I'll explain in a moment.
  callTarget(key: PropertyKey) : ReturnOrPassThroughType<MethodType>;
}

// So we can return the actual return value to exit out of the component tree,
// or we can return the pass-through type to signal "go on to the next" to
// the caller.  We can also execute `return __inserted__.callTarget(nextKey)`
// to pass off to another component.
export type ReturnOrPassThroughType<
  MethodType extends AnyFunction
> = ReturnType<MethodType> | PassThroughType<MethodType>;

// #endregion PassThroughType type

// This converts the method to another call signature, prepends the pass-through argument,
// and alters the return type to possibly return another pass-through.
export type MaybePassThrough<MethodType extends AnyFunction> = (
  __previousResults__: PassThroughType<MethodType>,
  ...args: Parameters<MethodType>
) => ReturnOrPassThroughType<MethodType>;

// This converts all methods of a class to the MaybePassThrough type.
// Properties we simply copy the type.
export type ComponentPassThroughClass<ClassType extends object> = {
  [Property in keyof ClassType]: ClassType[Property] extends AnyFunction ?
    MaybePassThrough<ClassType[Property]> :
    ClassType[Property];
}
