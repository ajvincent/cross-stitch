// #region PassThroughType type

import type {
  AnyFunction,
  PropertyKey,
} from "./Common.mjs";

export const PassThroughSymbol = Symbol("Indeterminate return");

/**
 * @typeParam PublicClassType - The class type each component guarantees to implement
 * @typeParam MethodType      - A public member method of PublicClassType
 * @typeParam ThisClassType   - A type with helper methods for components to call on the entryPoint.
 *                              Think of this as holding "pseudo-private" methods, which should be private in
 *                              the final integrated class.
 * @see KeyToComponentMap_Base.mts for implementation of PassThroughType, in PassThroughArgument.
 */
export type PassThroughType<
  PublicClassType extends object,
  MethodType extends AnyFunction,
  ThisClassType extends PublicClassType
> =
{
  // This marks the type as unique.
  [PassThroughSymbol]: boolean;

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

  // We can replace the arguments from one step to the next, using modifiedArguments.
  modifiedArguments: Parameters<MethodType>;

  // This allows us to call another method with the modifiedArguments.
  // ReturnOrPassThroughType I'll explain in a moment.
  callTarget(key: PropertyKey) : ReturnOrPassThroughType<PublicClassType, MethodType, ThisClassType>;

  readonly entryPoint: ThisClassType;
}

/**
 * This is so we can return the actual return value to exit out of the component tree,
 * or we can return the pass-through type to signal "go on to the next" to
 * the caller.  We can also execute `return __inserted__.callTarget(nextKey)`
 * to pass off to another component.
 *
 * @typeParam PublicClassType - The class type each component guarantees to implement
 * @typeParam MethodType      - A public member method of PublicClassType
 * @typeParam ThisClassType   - A type with helper methods for components to call on the entryPoint.
 *                              Think of this as holding "pseudo-private" methods, which should be private in
 *                              the final integrated class.
 */
export type ReturnOrPassThroughType<
  PublicClassType extends object,
  MethodType extends AnyFunction,
  ThisClassType extends PublicClassType
> = ReturnType<MethodType> | PassThroughType<PublicClassType, MethodType, ThisClassType>;

// #endregion PassThroughType type

/**
 * This converts the method to another call signature, prepends the pass-through argument,
 * and alters the return type to possibly return another pass-through.
 *
 * @typeParam PublicClassType - The class type each component guarantees to implement
 * @typeParam MethodType      - A public member method of PublicClassType
 * @typeParam ThisClassType   - A type with helper methods for components to call on the entryPoint.
 *                              Think of this as holding "pseudo-private" methods, which should be private in
 *                              the final integrated class.
 */
export type MaybePassThrough<
  PublicClassType extends object,
  MethodType extends AnyFunction,
  ThisClassType extends PublicClassType
> = (
  __previousResults__: PassThroughType<PublicClassType, MethodType, ThisClassType>,
  ...args: Parameters<MethodType>
) => ReturnOrPassThroughType<PublicClassType, MethodType, ThisClassType>;

/**
 * This converts all methods of a class to the MaybePassThrough type.
 * Properties we simply copy the type.
 *
 * @typeParam PublicClassType - The class type each component guarantees to implement
 * @typeParam MethodType      - A public member method of PublicClassType
 * @typeParam ThisClassType   - A type with helper methods for components to call on the entryPoint.
 *                              Think of this as holding "pseudo-private" methods, which should be private in
 *                              the final integrated class.
 */
export type ComponentPassThroughClass<
  PublicClassType extends object,
  ThisClassType extends PublicClassType
> = {
  [Property in keyof PublicClassType]: PublicClassType[Property] extends AnyFunction ?
    MaybePassThrough<PublicClassType, PublicClassType[Property], ThisClassType> :
    PublicClassType[Property];
}
