# Pass-through types

## Requirements

- [x] Exports
  - [x] In a subdirectory of source
  - [x] Component classes need a pass-through argument
  - [x] Bootstrap from standard API to a component class
  - [x] Sequence of component classes
- [x] Define the map of property keys to component classes
  - [x] At build time for integration tests
  - [x] Overrideable for unit tests
  - [x] Map a set to one instance for overrides
  - [x] Special protected field (key is a symbol) for shared base class
  - [x] How to handle private, static properties?
  - [x] Needs to hold properties for shared class outside
- [ ] JSON schema for configuring build projects
- [ ] Decorators
  - [ ] Add support to `InvokeTSC.mts`
  - [ ] `const stitch = CrossStitchDecorators.getNamespace(name);`
  - [ ] `@stitch.componentKey(componentName: string)`
  - [ ] `@stitch.setsReturn(always: boolean)`
  - [ ] `@stitch.sequence`
  - [ ] `@stitch.current` symbol for "current class or sequence" to feed into `@stitch.sequence`
  - [ ] `@stitch.entryPoint`
  - [ ] `@stitch.renameToPrivate(fieldName, "method" | "property" | "readonly property")` for entryPoint
  - [ ] `@stitch.rewriteForPrivate(fieldName, ts-morph callback)` for entryPoint
  - [ ] README: tie these concepts to aspect-oriented programming models
- [ ] TypeScript-ESLint to check properties for conflicts
  - [ ] Helper module to invoke these rules (until I can export them)
  - [ ] method names are unique except for those in the specified class type
  - [ ] setReturnType is callable only once per method (and that when `@mayReturn` is on the class)
  - [ ] Always require `return setReturnType(...);`
  - [ ] getReturnType is only called in the entry class
  - [ ] Component class methods must have a return type of void
  - [ ] Component class methods never have a return statement
  - [ ] Invoke helper module as a build step
  - [ ] Optional: overwriting modifiedArguments
  - [ ] Overwriting parameter arguments when someone overwrites modifiedArguments elsewhere
    - Is this even possible with eslint?  Multiple files is not their strength.
- [ ] Some sanity check that a `@setsReturn`-annotated class forces the return type to be set
  - [ ] Maybe by a forced ts-morph on a temporary copy, and InvokeTSC?

## Checklist

Source:

- [x] Create base "not implemented" class via TypeToClass
- [x] Key-to-component map
  - [x] `InstanceToComponentMap.defaultKeyMap`
  - [x] Pass `defaultKeyMap` into instances of the entry class
- [x] Create pass-through class type
  - [x] returns are void
  - [x] entryPoint: ThisClassType extends PublicClassType
  - [x] setReturnValue()
  - [x] getReturnType()
- [x] Extended "continue" class (returning previous results), copied from base class
- [x] Entry class ("ForwardTo_Base") copied from base class
  - [ ] Add a static property for the instance-to-component map
- [x] Sequence support
- [x] Extended "not implemented" class copied from base class

Spec-build:

- [x] Spy class
- [x] Add specs
  - [x] Base not implemented class
  - [x] Entry class
  - [x] Component not implemented class
  - [x] Component continue class
