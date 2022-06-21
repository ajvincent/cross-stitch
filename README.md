# Cross-stitch:  Aspect weaving unit-testable components, both dynamically and with static code rewriting

In my [es-membrane](https://github.com/ajvincent/es-membrane) project, I ran into a scalability problem.  I had a very complicated [`ProxyHandler`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy#handler_functions) implementation, one which _worked_ mostly, but was impossible to unit-test.

A `ProxyHandler` for a membrane is a complicated beast, with several aspects to support:

- Converting arguments from the source object graph to the target object graph
- Invoking the target proxy handler (usually `Reflect`)
- Converting return values from the target object graph to the source object graph
- Populating the properties of the shadow target
- Optional assertions
  - Did we associate each argument with the right object graph?
  - Did we meet the requirements from the `Proxy` specification?

This presents an unit-testing conundrum.  How do we safely break up the the combined `ProxyHandler` into unit-testable component classes,
each of which implement traps differently, and later reintegrate them?

## A realistic example

```typescript
class GraphProxyHandler<T extends object> implements ShadowProxyHandler<T> {
  getOwnPropertyDescriptor(
    shadowTarget: T,
    p: propertyKey,

    nextTarget: T,
    nextHandler: Required<ProxyHandler<T>>
  ): PropertyDescriptor | undefined
  {
    // revoke the proxy if one of the target graphs has been revoked
    this.#checkIfGraphsRevoked(shadowTarget, nextTarget, nextHandler);

    // get the property descriptor from the target graph
    let desc = nextHandler.getOwnPropertyDescriptor(nextTarget, p);

    // apply distortions
    desc = this.#distortions.some(d => d.modifyPropertyDescriptor(p, desc));

    // wrap the descriptor for the return value
    if (desc) {
      desc = this.#currentGraph.convertDescriptor(desc);
    }

    // update the shadow target for bookkeeping
    if (desc) {
      this.#setOwnPropertyDescriptor(shadowTarget, p, desc);
    }

    return desc;
  }

  ownKeys(
    shadowTarget: T,

    nextTarget: T,
    nextHandler: Required<ProxyHandler<T>>
  ): ArrayLike<propertyKey>
  {
    // revoke the proxy if one of the target graphs has been revoked
    this.#checkIfGraphsRevoked(shadowTarget, nextTarget, nextHandler);

    // get the ownKeys listing from the target graph
    let keys = nextHandler.ownKeys(nextTarget);

    // apply distortions
    keys = this.#distortions.some(d => d.modifyOwnKeys(nextTarget, keys));

    // update the shadow target for bookkeeping
    this.#updateOwnKeys(shadowTarget, keys);

    return keys;
  }
}
```

That's at least five different aspects for the final `ShadowProxyHandler` to support on each trap.  Imagine this written for __thirteen (13)__ different traps.  This gets messy, quickly.

## A much simpler example

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

This is much easier to understand.  

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
1. Leveraging [TypeScript ESTree](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/typescript-estree) to [parse TypeScript code and traverse](./_01_TypeScript_ESTree) the resulting [abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree).
2. (In progress) Scanning the source module(s) and [converting specified TypeScript types to generated classes](./_02_TypeScript_TypeToClass).
3. (In progress) Defining [pass-through types, types to rewrite existing user types, and generate component class stubs](./_03_passthrough_types).
4. (Pending) [A JSON schema for configuring build projects](https://github.com/ajvincent/cross-stitch/issues/12).
5. (Pending) [Defining aspect-oriented decorators, and dynamic runtime modules to bootstrap aspect weaving](https://github.com/ajvincent/cross-stitch/issues/7).
6. (Pending) [Static analysis](https://en.wikipedia.org/wiki/Static_program_analysis) and [weaving component classes into integrated modules](https://github.com/ajvincent/cross-stitch/issues/8).
7. (Pending) [Rollup](https://rollupjs.org/guide/en/) of [this project's code for exporting](https://github.com/ajvincent/cross-stitch/issues/10) via [npm](https://npmjs.com), including types.
8. (Pending) [Dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) via [my es-membrane project](https://github.com/ajvincent/es-membrane)
9. (Pending) [A command-line user interface](https://github.com/ajvincent/cross-stitch/issues/9).

