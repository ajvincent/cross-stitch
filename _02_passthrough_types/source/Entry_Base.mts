import {
  INVOKE_SYMBOL,

  // types
  AnyFunction,
  PropertyKey,
} from "./Common.mjs";

import {
  PassThroughArgument,

  // types
  PassThroughType,
  ReturnOrPassThroughType,
  MaybePassThrough,
  ComponentPassThroughMap,
} from "./PassThroughSupport.mjs";

/**
 * The entry point from a non-augmented type into pass-through-augmented components.
 */
export default class Entry_Base
{
  constructor() {
    if (new.target === Entry_Base)
      throw new Error("Do not construct this class directly: subclass it!");
  }

  /**
   * @typeParam TargetMethodType - The type of the original method.
   * @typeParam TargetClassType  - The type of the original class holding the method.
   * @param initialTarget    - The starting target name in passThroughMap.
   * @param passThroughMap   - The map of component classes.
   * @param methodName       - The name of the method we want to call, which we get from each component via Reflect.
   * @param initialArguments - The initial arguments to pass to the starting target.
   * @returns The original target method's type.
   */
  protected [INVOKE_SYMBOL]<
    TargetMethodType extends AnyFunction,
    TargetClassType extends object
  >
  (
    initialTarget: PropertyKey,
    passThroughMap: ComponentPassThroughMap<TargetClassType>,
    methodName: string,
    initialArguments: Parameters<TargetMethodType>
  ): ReturnType<TargetMethodType>
  {
    // Convenience types we'll use a few times.
    type PassThroughMethodType         = PassThroughType<TargetMethodType>;
    type MaybePassThroughMethodType    = MaybePassThrough<TargetMethodType>;
    type ReturnOrPassThroughMethodType = ReturnOrPassThroughType<TargetMethodType>;

    // Map from a set of classes to the specifie method in each class.
    // This will go into a `new Map(__keyAndCallbackArray)`.
    // {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map#parameters}
    const __keyAndCallbackArray__: [PropertyKey, MaybePassThroughMethodType][] = [];

    passThroughMap.forEach((component, key) => {
      const __method__ = Reflect.get(component, methodName) as MaybePassThroughMethodType;

      // A convenience callback to bind the method to its parent component and key.
      type Callback = (
        passThrough: PassThroughMethodType,
        ... __args__: Parameters<TargetMethodType>
      ) => ReturnOrPassThroughMethodType;

      const __callback__: Callback = (passThrough, ...__args__) => {
        __args__ = passThrough.modifiedArguments;
        return __method__.apply(
          component,
          [passThrough, ...__args__]
        );
      };

      __keyAndCallbackArray__.push([key, __callback__]);
    });

    if (!passThroughMap.has(initialTarget)) {
      throw new Error("No initial target?");
    }

    // Create our pass-through argument.
    const __passThrough__ = new PassThroughArgument<TargetMethodType>(
      initialTarget, __keyAndCallbackArray__, initialArguments
    )

    // Let it take over.
    return __passThrough__.run();
  }
}
