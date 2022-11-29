/**
 * @remarks
 *
 * This is all about establishing foundational knowledge about ts-morph's nodes, types,
 * symbols and signatures, and how to extract correct type information from them.
 *
 * The results from this will inform the design of helper utilities in TypeToClass and
 * other follow-on stages.
 */

import ts from "ts-morph";

import path from "path";
import url from "url";

describe("Basic type support from ts-morph: ", () => {
  let BasicTypes: ts.SourceFile;

  beforeAll(() => {
    const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");

    const project = new ts.Project({
      compilerOptions: {
        lib: ["es2022"],
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        moduleResolution: ts.ModuleResolutionKind.Node16,
        sourceMap: true,
        declaration: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      }
    });

    BasicTypes = project.addSourceFileAtPath(
      path.join(parentDir, "fixtures/BasicTypes.mts")
    );
  });

  // #region type aliases
  describe("Primitive type aliases report .getType().isObject() === false for", () => {
    const typeAndSpecArray: [typeName: string, expectation: string][] = [
      ["oneStringType", "a single string type"],
      ["oneNumberType", "a numeric literal type"],
      ["trueBooleanType", "a literal true"],
      ["falseBooleanType", "a literal false"],
      ["anyStringType", "a string type"],
      ["anyNumberType", "a number type"],
      ["anyBooleanType", "a boolean keyword"],
      ["anySymbolType", "a symbol type"],
      ["undefinedType", "an undefined keyword"],
      ["nullType", "a null keyword"],
      ["neverType", "a never keyword"],
      ["unknownType", "an unknown keyword"],
      ["voidType", "a void keyword"],

      // this doesn't make immediate sense as a primitive, but whatever.
      // maybe because it doesn't express properties.
      ["anyObjectType", "an object keyword"],

      ["OneTwoThreeType", "an enum of numbers"],
    ];

    typeAndSpecArray.forEach(([typeName, expectation]) => {
      it(expectation, () => {
        const decl = BasicTypes.getTypeAliasOrThrow(typeName);
        const type = decl.getType();
        expect(type.isObject()).toBe(false);
      });
    });
  });

  describe("Object type aliases report .getType().isObject() === true for", () => {
    const typeAndSpecArray: [typeName: string, expectation: string][] = [
      ["emptyObjectType", "an empty object type"],
      ["objectWithFooProperty", "an object with a property"],
      ["stringArray", "an array"],
      ["voidFunction", "an empty function returning void"],
    ];

    typeAndSpecArray.forEach(([typeName, expectation]) => {
      it(expectation, () => {
        const decl = BasicTypes.getTypeAliasOrThrow(typeName);
        const type = decl.getType();
        expect(type.isObject()).toBe(true);
      });
    });
  });

  describe("Intersection and union type aliases report .getType().isObject() === false for", () => {
    const typeAndSpecArray: [typeName: string, expectation: string][] = [
      ["objectIntersectionType", "a type intersection"],
      ["objectUnionType", "an union of object types"],
      ["objectNumberUnion", "an union of an object type and a primitive type"],
      ["unionOfStrings", "an union of strings"],
    ];

    typeAndSpecArray.forEach(([typeName, expectation]) => {
      it(expectation, () => {
        const decl = BasicTypes.getTypeAliasOrThrow(typeName);
        const type = decl.getType();
        expect(type.isObject()).toBe(false);
      });
    });
  });

  it("Type alias declarations report .isExported()", () => {
    const foo = BasicTypes.getTypeAliasOrThrow("objectWithFooProperty");
    expect(foo.isExported()).toBe(true);

    const bar = BasicTypes.getTypeAliasOrThrow("objectWithBarProperty");
    expect(bar.isExported()).toBe(false);
  });

  it("Source file cannot directly get block-scoped types", () => {
    expect(BasicTypes.getTypeAlias("myString")).toBe(undefined);
  });

  // #endregion type aliases

  describe("Interfaces", () => {
    describe("report .getType().isObject() === true", () => {
      it("for a non-empty interface", () => {
        const decl = BasicTypes.getInterfaceOrThrow("FooInterface");
        const type = decl.getType();
        expect(type.isObject()).toBe(true);
      });

      it("for an empty interface", () => {
        const decl = BasicTypes.getInterfaceOrThrow("EmptyInterface");
        const type = decl.getType();
        expect(type.isObject()).toBe(true);
      });
    });

    it("can have multiple interface declarations via their type symbol", () => {
      const firstDecl = BasicTypes.getInterfaceOrThrow("FooInterface");
      const symbol = firstDecl.getSymbolOrThrow();
      const declarations = symbol.getDeclarations();
      expect(declarations[0]).toBe(firstDecl);
      expect(declarations.length).toBe(2);
      expect(declarations[1]).not.toBe(firstDecl);
    });
  });

  xdescribe("Import declarations", () => {

  });

  describe("Fields of object type aliases and interfaces:", () => {
    xdescribe("Properties and methods: ", () => {

    });

    xit("Symbol keys appear with a ComputedPropertyName", () => {
      const decl = BasicTypes.getTypeAliasOrThrow("TypeHasSymbolKey")
      const typeNode = decl.getTypeNode();
      if (!ts.Node.isTypeLiteral(typeNode))
        throw new Error("expected TypeLiteralNode");

    });

    xdescribe("TypeReference nodes", () => {

    });

    xdescribe("Mapped types", () => {

    });
  });

  describe("Shared types among ", () => {
    it("type aliases", () => {
      const mainAlias = BasicTypes.getTypeAliasOrThrow("oneStringType");
      const sideAlias = BasicTypes.getTypeAliasOrThrow("oneStringTypeAlias");

      expect(mainAlias.getType()).toBe(sideAlias.getType());
    });

    it("a type alias and its type node", () => {
      const interfaceDecl = BasicTypes.getInterfaceOrThrow("FooInterface");
      const alias = BasicTypes.getTypeAliasOrThrow("FooInterfaceAlias");

      expect(alias.getType()).toBe(interfaceDecl.getType());
    });
  });

  // #region structures

  it("Node structures are unique objects which start out equal for the same node", () => {
    const barProperty = BasicTypes.getTypeAliasOrThrow("objectWithBarProperty");
    const leftStructure = barProperty.getStructure();
    const rightStructure = barProperty.getStructure();
    expect(leftStructure).not.toBe(rightStructure);
    expect(leftStructure).toEqual(rightStructure);
  });

  // #endregion structures
});
