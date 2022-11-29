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
});
