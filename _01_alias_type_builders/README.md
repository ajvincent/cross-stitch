# Type Builders

In order from base classes and interfaces to derived classes and interfaces:

- [PrinterKind](source/PrinterKind.mts): Defines the `PrinterKind` enum, which we can use for [discrimated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions).
- [TypePrinter](source/TypePrinter.mts): The base class for all type printers.  Provides:
  - a `print()` method for type alias creation
  - a `ready()` method for verification
- [StringWrapper](source/StringWrapper.mts): For handling strings and literals.
- [TypeBranch](source/TypeBranch.mts): Base classes and interfaces for all `TypePrinter` objects except:
  - `StringWrapper` because it can't have any children.
- [Root](source/Root.mts): for "root" type branch implementations.  I'm unsure if I need this.
- [Intersection](source/Intersection.mts): Intersections of types.
- [Union](source/Union.mts): Unions of types.
- [KeyofTypeofOperator](source/KeyofTypeofOperator.mts): Support for [`keyof`](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html) and [`typeof`](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html) operators.
- [IndexedAccess](source/IndexedAccess.mts): Support for [indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
- [TypeArgumented](source/TypeArgumented.mts): Support for [type arguments from generic types](https://www.typescriptlang.org/docs/handbook/2/generics.html).
