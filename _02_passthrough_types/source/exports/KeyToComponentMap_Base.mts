import { PropertyKey } from "./Common.mjs";
import { ComponentPassThroughClass } from "./PassThroughSupport.mjs";

class KeyToComponentMap<
  ClassType extends object
>
{
  #map = new Map<PropertyKey, ComponentPassThroughClass<ClassType>>;
  getComponent(key: PropertyKey) : ComponentPassThroughClass<ClassType>
  {
    const rv = this.#map.get(key);
    if (!rv)
      throw new Error("No component match!");
    return rv;
  }

  addComponent(key: PropertyKey, component: ComponentPassThroughClass<ClassType>) : void
  {
    if (this.#map.has(key))
      throw new Error("Key is already defined");
    this.#map.set(key, component);
  }

  get keys() : IterableIterator<PropertyKey>
  {
    return this.#map.keys();
  }

  clone(keys: PropertyKey[]) : KeyToComponentMap<ClassType>
  {
    const rv = new KeyToComponentMap<ClassType>;
    keys.forEach(key => {
      rv.addComponent(key, this.getComponent(key));
    });

    return rv;
  }
}

export default class InstanceToComponentMap<
  ClassType extends object
>
{
  #overrideMap = new WeakMap<ClassType, KeyToComponentMap<ClassType>>;
  #default = new KeyToComponentMap<ClassType>;

  getComponent(instance: ClassType, key: PropertyKey): ComponentPassThroughClass<ClassType>
  {
    const submap = this.#overrideMap.get(instance) ?? this.#default;
    return submap.getComponent(key);
  }

  addDefaultComponent(key: PropertyKey, component: ComponentPassThroughClass<ClassType>)
  {
    this.#default.addComponent(key, component);
  }

  get defaultKeys() : IterableIterator<PropertyKey>
  {
    return this.#default.keys;
  }

  override(instance: ClassType, keys: PropertyKey[]) : KeyToComponentMap<ClassType>
  {
    if (this.#overrideMap.has(instance))
      throw new Error("Override already exists for the instance!");

    const map = this.#default.clone(keys);
    this.#overrideMap.set(instance, map);
    return map;
  }
}
