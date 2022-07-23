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
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"], NumberStringType>,
    s: string,
    n: number
  ) : void

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"], NumberStringType>,
    n: number,
    s: string
  ) : void
};
```

This "pass-through type" has the same basic structure, with a prepended argument and a void return type for each method.  You set the actual return value by invoking `return __previousResults__.setReturnValue(rv);`.

What's the shape of this new argument?

```typescript
/**
 * @typeParam PublicClassType - The class type each component guarantees to implement
 * @typeParam MethodType      - A public member method of PublicClassType
 * @typeParam ThisClassType   - A type with helper methods for components to call on the entryPoint.
 *                              Think of this as holding "pseudo-private" methods, which should be private in
 *                              the final integrated class.
 * @see KeyToComponentMap_Base.mts for implementation of PassThroughType, in PassThroughArgument.
 */
export type PassThroughType<
  PublicClassType extends object,
  MethodType extends AnyFunction,
  ThisClassType extends PublicClassType
> =
{
  // This marks the type as unique.
  [PassThroughSymbol]: boolean;

  // We can replace the arguments from one step to the next, using modifiedArguments.
  modifiedArguments: Parameters<MethodType>;

  // This allows us to call another method with the modifiedArguments.
  callTarget(key: PropertyKey) : void;

  /**
   * Get the return value, if it's available.
   */
  getReturnValue() : [false, undefined] | [true, ReturnType<MethodType>];

  /**
   * Set the return value.  Write this as `return setReturnValue(...);`.
   *
   * @param value - The value to return.  Only callable once.
   */
  setReturnValue(value: ReturnType<MethodType>) : void;

  readonly entryPoint: ThisClassType;
}
```

Some sample code:

```typescript
export default class ExampleComponent implements PassThroughClassType
{
  repeatForward(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatForward"], ExtendedEntryPoint>,
    s: string,
    n: number
  ) : void
  {
    if ((__previousResults__.entryPoint).isLogging())
    {
      const rv = __previousResults__.callTarget("logEntry");
      // Please don't set methodArguments unless you absolutely have to.
      // This is effectively replacing existing arguments, which ESLint might warn you against anyway.
      /** @see {@link https://eslint.org/docs/latest/rules/no-param-reassign} */
      [s, n] = __previousResults__.modifiedArguments;
    }

    return __previousResults__.setReturnValue(s.repeat(n));
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"], ExtendedEntryPoint>,
    n: number,
    s: string
  ) : void
  {
    void(__previousResults__);
    void(n);
    void(s);
    throw new Error("not yetimplemented");
  }
}

```

`__previousResults__.entryPoint` represents the `this` value in an integrated class, while `.callTarget("logEntry")` shows how we can hand off to another component class.  If the other component replaces the arguments (again, this risks side effects), we can pick up the change right away.

## Code generation

From [`spec-build/support.mts`](spec-build/support.mts):

```typescript
const generator = new BaseClassGenerator(
  sourceDir.addSourceFileAtPath("NumberStringType.mts"),
  "NumberStringType",
  generatedDir,
  "NumberStringClass",
  "NumberStringClassWithPrivateFields",
);

await generator.run();
```

This will generate several files.  

- For your use:
  - `BaseClass.mts` for a stub not-implemented class from [`TypeToClass`](../_01_ts-morph_utilities/)
  - `KeyToComponentMap_Base.mts`, which exports a `InstanceToComponentMap` class.  
    - This class provides API to define components, sequences of components, and which component key is the starting point.
    - This module is also where `PassThroughArgument` instances, which implement `PassThroughType`, come from.
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
  ) : void
  {
    __previousResults__.callTarget("logEntry");
    __previousResults__.setReturnValue(s.repeat(n));
    __previousResults__.callTarget("logLeave");
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"]>,
    n: number,
    s: string
  ) : void
  {
    __previousResults__.callTarget("logEntry");
    __previousResults__.setReturnValue(s.repeat(n));
    __previousResults__.callTarget("logLeave");
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
  ) : void
  {
    (__previousResults__ as FullClass).log(this.#isBefore, "repeatForward");
  }

  repeatBack(
    __previousResults__: PassThroughType<NumberStringType, NumberStringType["repeatBack"]>,
    n: number,
    s: string
  ) : void
  {
    (__previousResults__ as FullClass).log(this.#isBefore, "repeatBack");
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
  return new FullClass(map.defaultKeyMap, console);
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
