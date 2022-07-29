import { DefaultMap } from "../../_00_shared_utilities/source/DefaultMap.mjs";

/*
interface CrossStitchDecoratorsInterface<ClassType extends object>
{
  componentKey(componentName: string) : ClassDecorator
}
*/

class CrossStitchDecorators
{
  #map = new WeakMap<Function, string>;

  componentKey(componentName: string) : ClassDecorator
  {
    const _map = this.#map;
    return function<TFunction extends Function>(_class: TFunction)
    {
      _map.set(_class, componentName);
    }
  }
}

const DecoratorsMap = new DefaultMap<string, CrossStitchDecorators>;

export function getStitchNamespace/*<
  ClassType extends object
>*/(name: string) : CrossStitchDecorators/*Interface<ClassType>*/
{
  return DecoratorsMap.getDefault(name, () => new CrossStitchDecorators)/* as CrossStitchDecoratorsInterface<ClassType>*/;
}
