# Type Builders

In order from base classes and interfaces to derived classes and interfaces:

- [BuilderKind](source/BuilderKind.mts): Defines the `BuilderKind` enum, which we can use for [discrimated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions).
- [TypePrinter](source/TypePrinter.mts): The base class for all type printers.  Provides:
  - a `print()` method for type alias creation
  - a `ready()` method for verification
- [StringWrapper](source/StringWrapper.mts): For handling strings and literals.
- [TypeBranch](source/TypeBranch.mts): Base classes and interfaces for all `TypePrinter` objects except:
  - `StringWrapper` because it can't have any children.
  - `TypeLiteral` because it represents a keyed object dictionary.
  - `MappedType` because its children follow specific rules.
