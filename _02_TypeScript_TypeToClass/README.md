# TypeScript type-to-class code generation

The pass-through types utilities generate new interfaces for a class to implement.  It also has to provide base classes which match the parameterized and rewritten types... not an easy task.  This directory exists to generate stub classes from these types.

Key classes:

- [`TSExportTypeExtractor.mts`](./source/TSExportTypeExtractor.mts) is a [traversal enter/leave observer](../_01_TypeScript_ESTree/source/ESTreeErrorUnregistered.mts) for [ESTreeTraversal](../_01_TypeScript_ESTree/README.md) to extract types from a TypeScript source file which the generator will need.
- [`TSFieldIterator.mts`](./source/TSFieldIterator.mts) is a [traversal enter/leave observer](../_01_TypeScript_ESTree/source/ESTreeErrorUnregistered.mts) to iterate over the fields of a type and notify a callback interface:
- [`ClassSources.mts`](./source/ClassSources.mts) defines an interface `ClassSources` and a base class `ClassSourcesBase` to provide fields as source code.
- [`Driver.mts`](./source/Driver.mts) invokes:
  - the parsing of source files,
  - the invocation of `TSExportTypeExtractor` to extract types,
  - the invocation of `TSFieldIterator` to request `ClassSources` provide properties and methods
  - the serialization of the `ClassSources` into an exported class to write to the filesystem

At this time, this is very much a work in progress.  [TODO](./source/TODO.md)
