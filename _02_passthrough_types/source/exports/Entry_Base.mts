import {
  INVOKE_SYMBOL,

  // types
  AnyFunction,
  PropertyKey,
} from "./Common.mjs";

import InstanceToComponentMap from "./KeyToComponentMap_Base.mjs";

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
   * @typeParam TargetMethodType - The type of the original method.
   * @typeParam TargetClassType  - The type of the original class holding the method.
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
    const passThrough = this.#extendedMap.buildPassThrough<MethodType>(
      this as unknown as ClassType,
      methodName,
      initialArguments
    );
    const startTarget = this.#extendedMap.defaultStart;
    if (!startTarget)
      throw new Error("assertion failure: we should have a start target");

    const result = passThrough.callTarget(startTarget);

    if (result === passThrough)
      throw new Error("No resolved result!");

    return result as ReturnType<MethodType>;
  }
}
