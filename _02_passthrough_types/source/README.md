# Pass-through types

## Requirements

- [x] Exports
  - [x] In a subdirectory of source
  - [x] Component classes need a pass-through argument
  - [x] Bootstrap from standard API to a component class
  - [x] Sequence of component classes
- [ ] Define the map of property keys to component classes
  - [x] At build time for integration tests
  - [x] Overrideable for unit tests
  - [x] Map a set to one instance for overrides
  - [x] Special protected field (key is a symbol) for shared base class
  - [ ] How to handle private, static properties?
  - [ ] Needs to hold properties for shared class outside
- [ ] JSON schema for configuring build projects
- [ ] Decorators
  - [ ] Add support to `InvokeTSC.mts`
  - [ ] `const stitch = CrossStitchDecorators.getNamespace(name);`
  - [ ] `@stitch.componentKey(componentName)`
  - [ ] `@stitch.setsReturn`
  - [ ] `@stitch.sequence`
  - [ ] `@stitch.current` symbol for "current class or sequence" to feed into `@stitch.sequence`
  - [ ] `@stitch.entryPoint`
  - [ ] `@stitch.renameToPrivate(fieldName)` for entryPoint
- [ ] TypeScript-ESLint to check properties for conflicts
  - [ ] Helper module to invoke these rules (until I can export them)
  - [ ] method names are unique except for those in the specified class type
  - [ ] setReturnType is callable only once per method (and that when `@mayReturn` is on the class)
  - [ ] getReturnType is only called in the entry class
  - [ ] Component class methods must have a return type of void
  - [ ] Component class methods never have a return statement
  - [ ] Invoke helper module as a build step

## Checklist

Source:

- [x] Create base "not implemented" class via TypeToClass
- [x] Key-to-component map
  - [ ] `InstanceToComponentMap.defaultKeyMap`
  - [ ] Pass `defaultKeyMap` into instances of the entry class
- [x] Create pass-through class type
  - [ ] returns are void
  - [ ] entryPoint: FinalClassType extends ClassType
  - [ ] setReturnType()
  - [ ] getReturnType()
- [x] Extended "continue" class (returning previous results), copied from base class
- [x] Entry class ("ForwardTo_Base") copied from base class
- [x] Sequence support
- [x] Extended "not implemented" class copied from base class

Spec-build:

- [x] Spy class
- [x] Add specs
  - [x] Base not implemented class
  - [x] Entry class
  - [x] Component not implemented class
  - [x] Component continue class
