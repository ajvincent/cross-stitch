# Pass-through types

## Requirements

- [ ] Exports
  - [ ] In a subdirectory of source
  - [ ] Component classes need a pass-through argument
  - [ ] Bootstrap from standard API to a component class
  - [ ] Sequence of component classes as a component class
- [ ] Define the map of property keys to component classes
  - [ ] At build time for integration tests
  - [ ] Overrideable for unit tests
  - [ ] Map a set to one instance for overrides
  - [ ] Special protected field (key is a symbol) for shared base class
  - [ ] How to handle private, static properties?
  - [ ] Needs to hold properties for shared class outside
- [ ] Use ts-morph to check properties for conflicts

## Checklist

Source:

- [x] Create base "not implemented" class via TypeToClass
- [x] Create pass-through class type
- [x] Extended "continue" class (returning previous results), copied from base class
- [ ] Entry class ("ForwardTo_Base") copied from base class
- [ ] Sequence class ("ForwardToSequence_Base") copied from base class
- [x] Extended "not implemented" class copied from base class

Spec-build:

- [ ] Return class
- [ ] Spy class
- [ ] Add specs
  - [x] Base not implemented class
  - [ ] Continue class
  - [ ] Entry class
  - [ ] Sequence class
  - [ ] Extended not implemented class
