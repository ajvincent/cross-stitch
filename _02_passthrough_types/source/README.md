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
- [ ] Use ts-morph to check properties for conflicts

## Checklist

Source:

- [x] Create base "not implemented" class via TypeToClass
- [x] Create pass-through class type
- [x] Extended "continue" class (returning previous results), copied from base class
- [x] Entry class ("ForwardTo_Base") copied from base class
- [x] Sequence support
- [x] Extended "not implemented" class copied from base class

Spec-build:

- [ ] Return class
- [x] Spy class
- [ ] Add specs
  - [x] Base not implemented class
  - [x] Entry class
  - [ ] Component not implemented class
  - [x] Component continue class
