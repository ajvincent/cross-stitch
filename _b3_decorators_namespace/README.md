# Decorators aren't ready yet

- [They're just now being implemented in Spidermonkey.](https://bugzilla.mozilla.org/show_bug.cgi?id=1435869)  
  - [Other engines (including V8) haven't started work yet.](https://github.com/tc39/proposal-decorators/issues/476)
  - TypeScript support has been bumped to 4.9 at the earliest.
- [NodeJS does a LTS release every October.](https://nodejs.org/en/about/releases/)  
  - As I write this, it's the end of July, 2022.  So it won't make the next release, NodeJS 18.
  - The release after that is October 2023, NodeJS 20, and that's too long to wait for proof-of-concept.
- TypeScript's experimental decorators:
  - They're known not to be compatible with the [TC39 stage 3 proposal](https://github.com/tc39/proposal-decorators).
  - Apparently they run in reverse order for class decorators, which this project is all about.
    - The [JavaScript Decorators.org webpage](https://javascriptdecorators.org/) seems to [implement the same for its tutorial](https://github.com/pabloalmunia/javacriptdecorators/issues/14), which is self-contradictory.
    - This would necessitate an `enter` and a `leave` decorator just to make sure it's running in the right order.  That's an ugly hack.
  - They don't recognize the `this` object very well right now: `@stitch.enter` doesn't pick up the `stitch` value.
  - The documentation is not clear on _typed_ decorators.

As I was writing this, I was contemplating moving the decorators modules back into stage 2, but I couldn't convince myself it would work there either.
