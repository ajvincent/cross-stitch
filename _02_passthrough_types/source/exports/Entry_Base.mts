import {
  INVOKE_SYMBOL,

  // types
  AnyFunction,
  PropertyKey,
} from "./Common.mjs";

import InstanceToComponentMap from "./KeyToComponentMap_Base.mjs";

export type Entry_BaseType<ClassType extends object> = ClassType & {
  [INVOKE_SYMBOL]<
    MethodType extends AnyFunction,
  >
  (
    methodName: PropertyKey,
    initialArguments: Parameters<MethodType>
  ): ReturnType<MethodType>
}

/**
 * The entry point from a non-augmented type into pass-through-augmented components.
 */
export default class Entry_Base<
  ClassType extends object,
  ThisClassType extends ClassType,
>
{
  readonly #extendedMap: InstanceToComponentMap<ClassType, ThisClassType>;

  constructor(
    extendedMap: InstanceToComponentMap<ClassType, ThisClassType>,
  )
  {
    if (new.target === Entry_Base)
      throw new Error("Do not construct this class directly: subclass it!");
    if (!extendedMap.defaultStart)
      throw new Error("No default start for the extended map?  I need one!");
    this.#extendedMap = extendedMap;
  }

  /**
   * @typeParam MethodType - The type of the original method.
   * @param methodName       - The name of the method we want to call, which we get from each component via Reflect.
   * @param initialArguments - The initial arguments to pass to the starting target.
   * @returns The original target method's type.
   */
  protected [INVOKE_SYMBOL]<
    MethodType extends AnyFunction,
  >
  (
    methodName: PropertyKey,
    initialArguments: Parameters<MethodType>
  ): ReturnType<MethodType>
  {
    const startTarget = this.#extendedMap.defaultStart;
    if (!startTarget)
      throw new Error("assertion failure: we should have a start target");

    // This is safe because we're in a protected method.
    const passThrough = this.#extendedMap.buildPassThrough<MethodType>(
      this as unknown as ThisClassType,
      methodName,
      initialArguments
    );

    passThrough.callTarget(startTarget);
    const [hasReturn, result] = passThrough.getReturnValue();
    if (!hasReturn)
      throw new Error("No resolved result!");

    return result;
  }
}
