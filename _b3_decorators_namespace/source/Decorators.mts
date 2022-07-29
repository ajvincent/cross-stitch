import { DefaultMap } from "../../_00_shared_utilities/source/DefaultMap.mjs";

export const stitchCurrent = Symbol("stitch current class");

type TClassDecorator<TFunction extends Function> = (target: TFunction) => TFunction | void;

class CrossStitchDecorators
{
  // #region Enter/leave sequence traps
  #decoratorState: "enter" | "leave" | "none" = "none";
  #currentClass?: Function;
  #decoratorSequence: ((_target: Function) => Function | void)[] = [];

  #pushDecorator<
    TFunction extends Function
  >(
    target: TFunction,
    decorator: (target: Function) => TFunction | void
  ) : void
  {
    if ((this.#decoratorState === "none") || (target !== this.#currentClass))
      throw new Error("Enclose your decorators in @stitch.enter and @stitch.leave!");
    if (this.#decoratorState === "enter")
      this.#decoratorSequence.push(decorator);
    else
      this.#decoratorSequence.unshift(decorator);
  }

  #resolveDecorators<TFunction extends Function>(target: TFunction) : TFunction
  {
    let _class = this.#currentClass as TFunction;
    if (target !== _class)
      throw new Error("Enclose your decorators in @stitch.enter and @stitch.leave!");
    const sequence = this.#decoratorSequence;
    this.#decoratorSequence = [];
    this.#currentClass = undefined;

    while (sequence.length)
    {
      const decorator = sequence.shift() as TClassDecorator<TFunction>;
      _class = decorator(_class) ?? _class;
    }

    return _class;
  }

  constructor() {
    this.enter = this.enter.bind(this);
    this.leave = this.leave.bind(this);
  }

  enter<TFunction extends Function>(target: TFunction) : TFunction | void
  {
    if (this.#decoratorState === "none") {
      this.#decoratorState = "enter";
      this.#currentClass = target;
    }
    else if (this.#decoratorState === "leave") {
      return this.#resolveDecorators(target);
    }
    else {
      throw new Error("Enclose your decorators in @stitch.enter and @stitch.leave!");
    }
  }

  leave<TFunction extends Function>(target: TFunction) : TFunction | void
  {
    if (this.#decoratorState === "none") {
      this.#decoratorState = "leave";
      this.#currentClass = target;
    }
    else if (this.#decoratorState === "enter") {
      return this.#resolveDecorators(target);
    }
    else {
      throw new Error("Enclose your decorators in @stitch.enter and @stitch.leave!");
    }
  }

  // #endregion Enter/leave sequence traps

  #classToComponentNameMap = new WeakMap<Function, string>;

  componentKey(componentName: string) : ClassDecorator
  {
    return <TFunction extends Function>(_class: TFunction) =>
    {
      this.#pushDecorator<TFunction>(
        _class,
        (_class: Function) : void =>
        {
          this.#classToComponentNameMap.set(_class, componentName)
        }
      );
    }
  }

  /*
  sequence(sequenceName: string, names: (string | symbol)[]) : ClassDecorator
  {
    const symbols = names.filter(n => typeof n === "symbol");
    if ((symbols.length > 1) || (symbols[0] !== stitchCurrent))
    {
      throw new Error("The only symbol you can have is stitchCurrent!")
    }

    return <TFunction extends Function>(_class: TFunction) =>
    {
      this.#pushDecorator<TFunction>(
        _class,
        (_class: Function) : void => {
          void(_class);
          void(names);
        }
      )
    }
  }
  */
}

const DecoratorsMap = new DefaultMap<string, CrossStitchDecorators>;

export function getStitchNamespace/*<
  ClassType extends object
>*/(name: string) : CrossStitchDecorators/*Interface<ClassType>*/
{
  return DecoratorsMap.getDefault(name, () => new CrossStitchDecorators)/* as CrossStitchDecoratorsInterface<ClassType>*/;
}
