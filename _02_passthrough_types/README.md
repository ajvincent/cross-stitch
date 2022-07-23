# Pass-through components

## Concepts as types

Consider again our base type:

```typescript
type NumberStringType = {
  repeatForward(
    s: string,
    n: number
  ): string;

  repeatBack(
    n: number,
    s: string
  ): string;
};
```

At this stage, all we have is an API.  We need some way of identifying components, and passing arguments between them.  So consider this type:

```typescript
type NumberStringTypeWithPassThrough = {
  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"]>,
    s: string,
    n: number
  ): string | PassThroughType<NumberStringType, NumberStringType["repeatForward"]>;

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"]>,
    n: number,
    s: string
  ): string | PassThroughType<NumberStringType, NumberStringType["repeatBack"]>;
};
```

This "pass-through type" has the same basic structure, with a prepended argument and a modified return type for each method.  Now, you can return the prepended argument from the pass-through type's methods.  Or (if the prepended argument's type is correct) you can return the invocation of a method of the prepended argument.

What's the shape of this new argument?

```typescript
export type PassThroughType<
  ClassType extends object,
  MethodType extends AnyFunction
> =
{
  // This marks the type as unique.
  [PassThroughSymbol]: boolean;

  // We can replace the arguments from one step to the next, using modifiedArguments.
  modifiedArguments: Parameters<MethodType>;

  // This allows us to call another method with the modifiedArguments.
  // ReturnOrPassThroughType I'll explain in a moment.
  callTarget(key: PropertyKey) : ReturnOrPassThroughType<ClassType, MethodType>;

  readonly entryPoint: ClassType;
}

export type ReturnOrPassThroughType<
  ClassType extends object,
  MethodType extends AnyFunction
> = ReturnType<MethodType> | PassThroughType<ClassType, MethodType>;
```

This API specifies three specific properties of the `PassThroughType` argument:

1. `modifiedArguments`, so you can change arguments from one component to another. (Strongly not recommended, but supported for compatibility)
2. `callTarget()` allows you to directly call another component class with the same method name, by a component name.
3. `entryPoint` gives you access to a shared component owning this and implementing the original API.

Some sample code:

```typescript
export default class ExampleComponent implements PassThroughClassType
{
  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"]>,
    s: string,
    n: number
  ): ReturnOrPassThroughType<NumberStringType, NumberStringType["repeatForward"]>
  {
    if ((__previousResults__.entryPoint as ExtendedEntryPoint).isLogging())
    {
      const rv = __previousResults__.callTarget("logEntry");
      if (rv !== __previousResults__)
        return rv;
      [s, n] = __previousResults__.modifiedArguments;
    }

    return s.repeat(n);
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"]>,
    n: number,
    s: string
  ): ReturnOrPassThroughType<NumberStringType, NumberStringType["repeatBack"]>
  {
    void(n);
    void(s);
    throw new Error("not yetimplemented");
  }
}

```

`__previousResults__.entryPoint` represents the `this` value in an integrated class, while `.callTarget("logEntry")` shows how we can hand off to another component class.  If the other component replaces the arguments (again, this is not recommended), we can pick up the change right away.

## Code generation

From [`spec-build/support.mts`](spec-build/support.mts):

```typescript
const generator = new BaseClassGenerator(
  sourceDir.addSourceFileAtPath("NumberStringType.mts"),
  "NumberStringType",
  generatedDir,
  "NumberStringClass"
);

await generator.run();
```

This will generate several files.  

- For your use:
  - `BaseClass.mts` for a stub not-implemented class from [`TypeToClass`](../_01_ts-morph_utilities/)
  - `KeyToComponentMap_Base.mts`, which exports a `InstanceToComponentMap` class.  This class provides API to define components, sequences of components, and which component key is the starting point.
  - `EntryClass.mts` implementing your original type (in examples above, `NumberStringType`) to directly invoke a component class's equivalent method.  It takes an `InstanceToComponentMap` as a constructor argument.  I recommend subclassing this for additional properties.
  - `PassThrough_Continue.mts` as a base class for component classes.  Use this when you want to allow methods to not be implemented.
  - `PassThrough_NotImplemented.mts` as a base class for component classes.  Use this when you _want_ to throw for methods you haven't implemented.
- For internal use:
  - `Common.mts` for shared TypeScript types.
  - `Entry_Base.mts`, which is the base class for `EntryClass.mts`, to actually create the `PassThroughType` and invoke the starting component's matching method.
  - `PassThroughClassType.mts` just defines a helper type.  Technically it isn't required, and I may delete it later.
  - `PassThroughSupport.mts` defines the generic types for component classes.

## Tying components together

This is manual for now.  Decorators and a custom JSON schema will automate this, and I'll add a new section here as I flesh them out.

### FullClass.mts

```typescript
import EntryClass from "./generated/EntryClass.mts";
import InstanceToComponentMap from "./generated/KeyToComponentMap_Base.mjs";
import type { NumberStringType } from "./generated/NumberStringType.mts";

export default class FullClass extends EntryClass
{
  readonly #console: Console;

  constructor(
    extendedMap: InstanceToComponentMap<ClassType>,
    console: Console,
  )
  {
    super(extendedMap);
    this.#console = console;
  }

  log(isBefore: boolean, message: string) : void
  {
    this.#console.log((isBefore ? "enter" : "leave") + " " + message);
  }
}
```

### MainComponent.mts

```typescript
import ComponentBase from "./generated/PassThrough_Continue.mts";

export class MainClass extends ComponentBase
{
  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"]>,
    s: string,
    n: number
  ): ReturnOrPassThroughType<NumberStringType, NumberStringType["repeatForward"]>
  {
    __previousResults__.callTarget("logEntry");
    const rv = s.repeat(n);
    __previousResults__.callTarget("logLeave");
    return rv;
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"]>,
    n: number,
    s: string
  ): ReturnOrPassThroughType<NumberStringType, NumberStringType["repeatBack"]>
  {
    __previousResults__.callTarget("logEntry");
    const rv = s.repeat(n);
    __previousResults__.callTarget("logLeave");
    return rv;
  }
}

export function addComponents(
  extendedMap: InstanceToComponentMap<ClassType>,
)
{
  extendedMap.addDefaultComponent("main", new MainClass(extendedMap));
  extendedMap.defaultStart = "main";
}
```

### LoggingComponents.mts

```typescript
import ComponentBase from "./generated/PassThrough_Continue.mts";

export class LoggingClass extends ComponentBase
{
  #isBefore: boolean;
  constructor(
    extendedMap: InstanceToComponentMap<ClassType>,
    isBefore: boolean,
  )
  {
    super(extendedMap);
    this.#isBefore = isBefore;
  }
  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"]>,
    s: string,
    n: number
  ): ReturnOrPassThroughType<NumberStringType, NumberStringType["repeatForward"]>
  {
    (__previousResults__ as FullClass).log(this.#isBefore, "repeatForward");
    return __previousResults__;
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"]>,
    n: number,
    s: string
  ): ReturnOrPassThroughType<NumberStringType, NumberStringType["repeatBack"]>
  {
    (__previousResults__ as FullClass).log(this.#isBefore, "repeatBack");
    return __previousResults__;
  }
}

export function addComponents(
  extendedMap: InstanceToComponentMap<ClassType>,
)
{
  extendedMap.addDefaultComponent("logEntry", new LoggingClass(extendedMap, true));
  extendedMap.addDefaultComponent("logLeave", new LoggingClass(extendedMap, false));
}
```

### integration.mts

```typescript
import InstanceToComponentMap from "./generated/KeyToComponentMap_Base.mjs";
import FullClass from "./FullClass.mts";
import { addComponents as addMain } from "./MainClass.mts";
import { addComponents as addLogging } from "./Logging.mts";

const map = new InstanceToComponentMap;
addMain(map);
addLogging(map);

export default function __Builder__(
  console: Console,
)
{
  return new FullClass(map, console);
}
```

### spec.mts

```typescript
import FullClass from "./integration.mts";
import { Console } from "console";

describe("FullClass", () => {
  let instance;
  beforeEach(() => instance = new FullClass(new Console));

  it("repeatForward works", () => {
    expect(instance.repeatForward("foo", 3)).toBe("foofoofoo");
  });
});
```
