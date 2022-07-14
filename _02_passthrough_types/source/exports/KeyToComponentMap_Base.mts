import {
  AnyFunction,
  PropertyKey
} from "./Common.mjs";

import {
  ComponentPassThroughClass,
  PassThroughSymbol,
  PassThroughType,
  MaybePassThrough,
  ReturnOrPassThroughType,
} from "./PassThroughSupport.mjs";

class KeyToComponentMap<
  ClassType extends object
>
{
  #map = new Map<
    PropertyKey,
    ComponentPassThroughClass<ClassType>
  >;
  #startComponent?: PropertyKey;

  #sequenceMap = new Map<PropertyKey, PropertyKey[]>;

  constructor()
  {
    if (new.target !== KeyToComponentMap)
      throw new Error("This class may not be subclassed!");
    Object.freeze(this);
  }

  static #validateKey(key: PropertyKey) : void
  {
    if (key === "")
      throw new Error("key cannot be an empty string!");
  }

  getComponent(key: PropertyKey) : ComponentPassThroughClass<ClassType>
  {
    KeyToComponentMap.#validateKey(key);
    const rv = this.#map.get(key);
    if (!rv)
      throw new Error("No component match!");
    return rv;
  }

  addComponent(key: PropertyKey, component: ComponentPassThroughClass<ClassType>) : void
  {
    KeyToComponentMap.#validateKey(key);
    if (this.#map.has(key) || this.#sequenceMap.has(key))
      throw new Error("Key is already defined!");
    this.#map.set(key, component);
  }

  get keys() : IterableIterator<PropertyKey>
  {
    return this.#map.keys();
  }

  get startComponent() : PropertyKey | undefined
  {
    return this.#startComponent;
  }

  set startComponent(key: PropertyKey | undefined)
  {
    if (key === undefined)
      throw new Error("Start component must be a non-empty string or a symbol!");
    KeyToComponentMap.#validateKey(key);

    if (this.#startComponent)
      throw new Error("This map already has a start component!");

    if (!this.#map.has(key) && !this.#sequenceMap.has(key))
      throw new Error("You haven't registered the start component yet!");

    this.#startComponent = key;
  }

  buildPassThrough<
    MethodType extends AnyFunction
  >
  (
    methodName: PropertyKey,
    initialArguments: Parameters<MethodType>
  ) : PassThroughType<MethodType>
  {
    return new PassThroughArgument<ClassType, MethodType>(this, methodName, initialArguments);
  }

  addSequence(
    topKey: PropertyKey,
    subKeys: PropertyKey[]
  ) : void
  {
    if (subKeys.length === 0)
      throw new Error("There must be some subkeys!");

    {
      const setOfKeys = new Set(subKeys);
      if (setOfKeys.size < subKeys.length)
        throw new Error("Duplicate key among the subkeys!");
      if (setOfKeys.has(topKey))
        throw new Error("Top key cannot be among the subkeys!");
    }

    subKeys.forEach(subKey => {
      if (!this.#map.has(subKey) && !this.#sequenceMap.has(subKey))
        throw new Error(`Unknown subkey ${String(subKey)}`);
    });

    if (this.#map.has(topKey) || this.#sequenceMap.has(topKey))
      throw new Error(`The top key is already in the map!`);

    this.#sequenceMap.set(topKey, subKeys);
  }

  getSequence(
    topKey: PropertyKey
  ): PropertyKey[]
  {
    return this.#sequenceMap.get(topKey)?.slice() ?? [];
  }
}
Object.freeze(KeyToComponentMap);
Object.freeze(KeyToComponentMap.prototype);

export default class InstanceToComponentMap<
  ClassType extends object
>
{
  #overrideMap = new WeakMap<ClassType, KeyToComponentMap<ClassType>>;
  #default = new KeyToComponentMap<ClassType>;

  constructor()
  {
    if (new.target !== InstanceToComponentMap)
      throw new Error("This class may not be subclassed!");
    Object.freeze(this);
  }

  getComponent(instance: ClassType, key: PropertyKey): ComponentPassThroughClass<ClassType>
  {
    const submap = this.#overrideMap.get(instance) ?? this.#default;
    return submap.getComponent(key);
  }

  addDefaultComponent(key: PropertyKey, component: ComponentPassThroughClass<ClassType>) : void
  {
    this.#default.addComponent(key, component);
  }

  addDefaultSequence(
    topKey: PropertyKey,
    subKeys: PropertyKey[]
  ) : void
  {
    return this.#default.addSequence(topKey, subKeys);
  }

  get defaultKeys() : IterableIterator<PropertyKey>
  {
    return this.#default.keys;
  }

  get defaultStart() : PropertyKey | undefined
  {
    return this.#default.startComponent;
  }

  set defaultStart(key: PropertyKey | undefined)
  {
    this.#default.startComponent = key;
  }

  buildPassThrough<
    MethodType extends AnyFunction
  >
  (
    instance: ClassType,
    methodName: PropertyKey,
    initialArguments: Parameters<MethodType>
  ) : PassThroughType<MethodType>
  {
    const submap = this.#overrideMap.get(instance) ?? this.#default;
    return submap.buildPassThrough(methodName, initialArguments);
  }

  override(instance: ClassType, keys: PropertyKey[]) : KeyToComponentMap<ClassType>
  {
    if (this.#overrideMap.has(instance))
      throw new Error("Override already exists for the instance!");

    const map = new KeyToComponentMap<ClassType>;

    keys.forEach(key => map.addComponent(
      key, this.#default.getComponent(key)
    ));

    this.#overrideMap.set(instance, map);
    return map;
  }
}
Object.freeze(InstanceToComponentMap);
Object.freeze(InstanceToComponentMap.prototype);

class PassThroughArgument<
  ClassType extends object,
  MethodType extends AnyFunction
>
{
  [PassThroughSymbol] = true;
  modifiedArguments: Parameters<MethodType>;

  #componentMap: KeyToComponentMap<ClassType>;
  #methodName: PropertyKey;
  #visitedTargets: Set<PropertyKey> = new Set;

  constructor(
    map: KeyToComponentMap<ClassType>,
    methodName: PropertyKey,
    initialArguments: Parameters<MethodType>
  )
  {
    this.#componentMap = map;
    this.#methodName = methodName;
    this.modifiedArguments = initialArguments;
    Object.seal(this);
  }

  callTarget(componentKey: PropertyKey) : ReturnOrPassThroughType<MethodType>
  {
    if (this.#visitedTargets.has(componentKey))
      throw new Error(`Visited target "${String(componentKey)}"!`)
    this.#visitedTargets.add(componentKey);

    const sequence = this.#componentMap.getSequence(componentKey);
    if (sequence.length) {
      let result: ReturnOrPassThroughType<MethodType>;
      do {
        result = this.callTarget(sequence.shift() as PropertyKey);
        if (result !== this)
          return result;
      } while (sequence.length);
      return result;
    }

    const component = this.#componentMap.getComponent(componentKey);
    if (!component)
      throw new Error(`Missing target "${String(componentKey)}"!`);

    const method = Reflect.get(component, this.#methodName) as MaybePassThrough<MethodType>;
    return method.apply(component, [this, ...this.modifiedArguments]);
  }
}
Object.freeze(PassThroughArgument);
Object.freeze(PassThroughArgument.prototype);
