import { INVOKE_SYMBOL, AnyFunction } from "./Common.mjs";

import type {
  PassThroughType,
  ReturnOrPassThroughType,
  MaybePassThrough,
  ComponentPassThroughClass,
  ComponentPassThroughMap,
} from "./PassThroughSupport.mjs";

/**
 * A base class for a sequence of augmented components.
 *
 * Create a subclass of ForwardTo_Base first,
 */
export default class ForwardToSequence_Base<ClassType extends object>
{
  #subkeys: ReadonlyArray<string | symbol>;
  readonly #map: ComponentPassThroughMap<ClassType>;

  /**
  * @param key     - A root key to define to track the subkeys.
  * @param subkeys - The sequence of subkeys to run for this class.
  * @param map     - The map of keys to component classes.
  */
  constructor(
    key: string | symbol,
    subkeys: (string | symbol)[],
    map: ComponentPassThroughMap<ClassType>,
  )
  {
    if (new.target === ForwardToSequence_Base)
      throw new Error("Do not construct this class directly: subclass it!");

    if ((new Set(subkeys)).size !== subkeys.length)
      throw new Error("Duplicate key among the subkeys!");

    if (map.has(key))
      throw new Error(`The key "${String(key)}" is already in the map!`);

    this.#subkeys = subkeys;
    this.#map = map;

    // Cache this in the map as a defined component.
    map.set(key, this as unknown as ComponentPassThroughClass<ClassType>);
  }

  /**
  * Invoke each method of the sequence of components, until we get a definite result.
  * @typeParam TargetMethodType - The type of the method we will call.
  * @param methodName           - The name of the method we will call on each component.
  * @param passThroughArgument  - The pass-through argument from ForwardTo_Base.
  * @param __args__             - The original arguments.
  * @returns The first definitive result.
  */
  protected [INVOKE_SYMBOL]<
    TargetMethodType extends AnyFunction
  >
  (
    methodName: string,
    passThroughArgument: PassThroughType<TargetMethodType>,
  ): ReturnOrPassThroughType<TargetMethodType>
  {
    // Sanity check.
    for (const key of this.#subkeys)
    {
      if (!this.#map.has(key))
        throw new Error(`No component pass through for key "${String(key)}"!`);
    }

    let result: ReturnOrPassThroughType<TargetMethodType> = passThroughArgument;

    for (const key of this.#subkeys)
    {
      const entry = this.#map.get(key);
      if (!entry) {
        // In some situations, we may not have a component for a given key.
        // Thimk of this as handling debugging code, which we simply don't enable.
        continue;
      }

      // Call the augmented method of the component.
      const callback = Reflect.get(entry, methodName) as MaybePassThrough<TargetMethodType>;
      result = callback(passThroughArgument, ...passThroughArgument.modifiedArguments);

      if (result !== passThroughArgument) {
        // We're done.
        break;
      }
    }

    return result;
  }
}
