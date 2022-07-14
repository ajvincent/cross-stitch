import { PropertyKey } from "./Common.mjs";
import { ComponentPassThroughClass } from "./PassThroughSupport.mjs";

class KeyToComponentMap<
  ClassType extends object
>
{
  #map = new Map<PropertyKey, ComponentPassThroughClass<ClassType>>;
  #startComponent?: PropertyKey;

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
    if (this.#map.has(key))
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

    if (!this.#map.has(key))
      throw new Error("You haven't registered the start component yet!");

    this.#startComponent = key;
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
