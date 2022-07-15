import {
  INVOKE_SYMBOL,

  // types
  AnyFunction,
  PropertyKey,
} from "./Common.mjs";

import InstanceToComponentMap from "./KeyToComponentMap_Base.mjs";
import { PassThroughSymbol } from "./PassThroughSupport.mjs";

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
  ClassType extends object
>
{
  readonly #extendedMap: InstanceToComponentMap<ClassType>;

  constructor(
    extendedMap: InstanceToComponentMap<ClassType>,
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
      this as unknown as ClassType,
      methodName,
      initialArguments
    );

    const result = passThrough.callTarget(startTarget);
    if ((Object(result) === result) && Reflect.has(result, PassThroughSymbol))
      throw new Error("No resolved result!");

    return result as ReturnType<MethodType>;
  }
}
