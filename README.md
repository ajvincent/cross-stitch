# Cross-stitch:  Aspect weaving unit-testable components, both dynamically and with static code rewriting

Programmers like unit-testable components.  Ultimately, we have to craft integrated classes which are no longer unit-testable.  This project is about providing a framework via JavaScript decorators for weaving together components as a build step into integrated classes.  This way, you can keep the unit-testing at one level and integration testing on another.

## A simple example: three aspects intermixed

```typescript
type NumberStringType = {
  repeatForward(s: string, n: number): string;
  repeatBack(n: number, s: string): string;
};

export default class NSTypeRepeater implements NumberStringType
{
  #console: Console | undefined
  constructor(
    c?: Console
  )
  {
    this.#console = c;
  }

  repeatForward(
    s: string,
    n: number
  ): string
  {
    // before advice: LogOnEntry
    this.#console?.debug("enter repeatForward");

    // the actual action
    const result = s.repeat(n);

    // after advice: LogOnLeave
    this.#console?.debug("leave repeatForward");
    return result;
  }

  repeatBack(
    n: number,
    s: string
  ): string
  {
    // before advice: LogOnEntry
    this.console?.debug("enter repeatBack");

    // the actual action
    const result = s.repeat(n);

    // after advice: LogOnLeave
    this.console?.debug("leave repeatBack");
    return result;
  }
}
```

Here we have three aspects, across two different methods of one integrated class.  Testing this class's behavior is not easy.

## Component classes, with some helper code

Suppose we had some code to break this up into smaller parts, with a _little_ bit of TypeScript rewriting.

```typescript
// Repeater.mts: the actual processor
@sequence("LogOnEntry", sequence.SELF, "LogOnLeave")
export default class NSTypeRepeater
extends @common("NSTypeLogger_Base")
implements ComponentPassThroughClass<NumberStringType>
{
  repeatForward(
    __passThrough__: MaybePassThrough<string>
    s: string,
    n: number
  ): MaybePassThroughExit
  {
    // the actual action
    __passThrough__.returnValue = s.repeat(n);
    return __passThrough__.exit;
  }

  repeatBack(
    __passThrough__: MaybePassThrough<string>
    n: number,
    s: string
  ): MaybePassThroughExit
  {
    // the actual action
    __passThrough__.returnValue = s.repeat(n);
    return __passThrough__.exit;
  }
}
```

```typescript
// RepeaterBase.mts: A base class, for shared components between aspects
@defineBase("NSTypeRepeater")
export default class __NSTypeRepeater_base__
{
  #__protected__: Partial<{
    console: Console | undefined
  }>;
  protected get __protected__(): Partial<{
    console: Console | undefined
  }>
  {
    return this.#__protected__;
  }

  constructor(
    c?: Console
  )
  {
    this.#__protected__ = {};
    this.#__protected__.console = c;
  }
}
```

```typescript
// LogOnEntry.mts: the "before advice" for Repeater.mts
@aspect("LogOnEntry")
export default class NSTypeRepeater
extends @common("NSTypeLogger_Base")
implements ComponentPassThroughClass<NumberStringType>
{
  get __protected__(): Partial<{
    console: Console | undefined
  }>
  {
    throw new Error("not available")!
  }

  repeatForward(
    __passThrough__: MaybePassThrough<string>
    s: string,
    n: number
  ): MaybePassThroughExit
  {
    super.__protected__.console?.debug("enter repeatForward");
    return __passThrough__.exit;
  }

  repeatBack(
    __passThrough__: MaybePassThrough<string>
    n: number,
    s: string
  ): MaybePassThroughExit
  {
    // before advice: LogOnEntry
    super.__protected__.console?.debug("enter repeatBack");
    return __passThrough__.exit;
  }
}
```

```typescript
// LogOnLeave.mts: the "after return advice" for Repeater.mts
@aspect("LogOnLeave")
export default class NSTypeLogger
extends @common("NSTypeLogger_Base")
implements ComponentPassThroughClass<NumberStringType>
{
  get __protected__(): Partial<{
    console: Console | undefined
  }>
  {
    throw new Error("not available")!
  }

  repeatForward(
    __passThrough__: MaybePassThrough<string>
    s: string,
    n: number
  ): MaybePassThroughExit
  {
    super.__protected__.console?.debug("leave repeatForward");
    return __passThrough__.exit;
  }

  repeatBack(
    __passThrough__: MaybePassThrough<string>
    n: number,
    s: string
  ): MaybePassThroughExit
  {
    super.__protected__.console?.debug("leave repeatBack");
    return __passThrough__.exit;
  }
}
```

Arguably, this is complicated in a different way, but consider:  each of these files is much simpler.  You can unit-test each component without side-effects on the others, depending on how the [ECMAScript decorators (currently a stage 3 proposal)](https://github.com/tc39/proposal-decorators) (like `@aspect` and `@sequence`) work.

The decorators also provide enough context for run-time aspect-oriented programming, where a driver class can create the `__passThrough__` arguments, and call each aspect, including the original intended code, dynamically.

More importantly, the decorators provide enough (I hope!) information to __statically re-weave__ the components into an integrated module _as a build step_, for full-on application testing.

This re-weaving - both dynamically through helper code, and statically through rewriting tools - is why I called this project "cross-stitch".  It's a pun on aspect weaving...

Now, I haven't _fully_ thought through the example above as I write this.  So expect the above example to evolve as this project does.

## How to get there: A roadmap

This project will take several phases to complete:
1. Leveraging [ts-morph](https://ts-morph.com) to [generate stub classes from existing types](./_01_ts-morph_utilities/).
2. (In progress) Defining [pass-through types, types to rewrite existing user types, and generate component class stubs](./_02_passthrough_types).
3. (Pending) [A JSON schema for configuring build projects](https://github.com/ajvincent/cross-stitch/issues/12).
4. (Pending) [Defining aspect-oriented decorators, and dynamic runtime modules to bootstrap aspect weaving](https://github.com/ajvincent/cross-stitch/issues/7).
5. (Pending) [Static analysis](https://en.wikipedia.org/wiki/Static_program_analysis) and [weaving component classes into integrated modules](https://github.com/ajvincent/cross-stitch/issues/8).
6. (Pending) [Rollup](https://rollupjs.org/guide/en/) of [this project's code for exporting](https://github.com/ajvincent/cross-stitch/issues/10) via [npm](https://npmjs.com), including types.
7. (Pending) [Dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) via [my es-membrane project](https://github.com/ajvincent/es-membrane)
8. (Pending) [A command-line user interface](https://github.com/ajvincent/cross-stitch/issues/9).
