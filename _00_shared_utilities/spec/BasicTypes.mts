/**
 * @remarks
 *
 * This is all about establishing foundational knowledge about ts-morph's nodes, types,
 * symbols and signatures, and how to extract correct type information from them.
 *
 * The results from this will inform the design of helper utilities in TypeToClass and
 * other follow-on stages.
 *
 * This might turn out to be actually a Hard Problem.  There are be types with an
 * infinite set of field keys:
 *
 * type ManyProperties = {
 *   // IndexSignature, https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures
 *   [key: string]: true;
 * };
 *
 * Those we cannot resolve in TypeToClass.  It's just not possible to generate all the keys
 * which this type matches.
 *
 * So we have to figure out from the type structure if we have a finite set of keys or not.
 * This must happen before we attempt to figure out the type definitions for each key.
 *
 * type FiniteProperties = {
 *   // MappedType, https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
 *   [key in "foo" | "bar"]: someOtherType;
 * };
 *
 * Mapped types give us a different sort of trouble.  We might be better off replacing, at least temporarily,
 * the MappedType node with a set of other nodes.  The good news is the claim in the handbook that the
 * type parameter's type operator must be a union of PropertyKey's.  So it's a finite, enumerable set, and
 * we should be able to extract the set easily.
 */

import ts from "ts-morph";

import path from "path";
import url from "url";
import { type } from "os";

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
        const decl = BasicTypes.getTypeAliasOrThrow(typeName).asKindOrThrow(
          ts.SyntaxKind.TypeAliasDeclaration
        );
        const type = decl.getType();
        expect(type.isObject()).toBe(false);
      });
    });
  });

  describe("Object type aliases report .getType().isObject() === true for", () => {
    const typeAndSpecArray: [typeName: string, expectation: string][] = [
      ["emptyObjectType", "an empty object type"],
      ["objectWithFooProperty", "an object with a property"],
      ["stringArray", "an array of strings"],
      ["stringNumberAndBoolean", "a tuple of specific types"],
      ["voidFunction", "an empty function returning void"],
    ];

    typeAndSpecArray.forEach(([typeName, expectation]) => {
      it(expectation, () => {
        const decl = BasicTypes.getTypeAliasOrThrow(typeName).asKindOrThrow(
          ts.SyntaxKind.TypeAliasDeclaration
        );
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
        const decl = BasicTypes.getTypeAliasOrThrow(typeName).asKindOrThrow(
          ts.SyntaxKind.TypeAliasDeclaration
        );
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

  it("TypeAliasDeclaration reports its type parameters", () => {
    const decl = BasicTypes.getTypeAliasOrThrow("GetterAndSetter").asKindOrThrow(
      ts.SyntaxKind.TypeAliasDeclaration
    );
    const typeParameters = decl.getTypeParameters();
    expect(typeParameters.length).toBe(1);

    const firstTypeParam = typeParameters[0].getStructure();
    expect(firstTypeParam.name).toBe("T");
    expect(firstTypeParam.constraint).toBe("unknown");
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

  function getAliasTypeNodeByName<
    TKind extends ts.SyntaxKind
  >(
    name: string,
    kind: TKind
  ) : ts.KindToNodeMappings[TKind]
  {
    return BasicTypes.getTypeAliasOrThrow(name).getTypeNodeOrThrow().asKindOrThrow(kind);
  }

  describe("Extracting fields of object type aliases and interfaces:", () => {
    it("TypeLiteral with no mapped types", () => {
      const typeLiteral = getAliasTypeNodeByName<
        ts.SyntaxKind.TypeLiteral
      >("NumberStringType", ts.SyntaxKind.TypeLiteral);

      const members = typeLiteral.getMembers();
      const structures = members.map(m => m.getStructure());
      expect(structures.length).toBe(2);
      expect(structures[0].kind).withContext(
        "first member should be a MethodSignature"
      ).toBe(ts.StructureKind.MethodSignature);
      expect(structures[1].kind).withContext(
        "second member should be a MethodSignature"
      ).toBe(ts.StructureKind.MethodSignature);
    });

    it("PropertySignature of a TypeLiteral", () => {
      const typeLiteral = getAliasTypeNodeByName<
        ts.SyntaxKind.TypeLiteral
      >("objectWithBarProperty", ts.SyntaxKind.TypeLiteral);

      const property = typeLiteral.getMembers()[0].asKindOrThrow(
        ts.SyntaxKind.PropertySignature
      ).getStructure();

      expect(property.name).toBe("barObject");
      expect(property.type).toBe("unknown");
      expect(property.isReadonly).toBe(false);
    });

    it("GetAccessorSignature and SetAccessorSignature of a TypeLiteral", () => {
      const alias = BasicTypes.getTypeAliasOrThrow("GetterAndSetter");

      const typeLiteral = getAliasTypeNodeByName<
        ts.SyntaxKind.TypeLiteral
      >("GetterAndSetter", ts.SyntaxKind.TypeLiteral);

      const members = typeLiteral.getMembers();
      const getter = members[0].asKindOrThrow(
        ts.SyntaxKind.GetAccessor
      ).getStructure();

      expect(getter.name).toBe("value");
      expect(getter.typeParameters).toEqual([]);
      expect(getter.parameters).toEqual([]);
      expect(getter.returnType).toBe("T");

      const setter = members[1].asKindOrThrow(
        ts.SyntaxKind.SetAccessor
      ).getStructure();

      expect(setter.name).toBe("value");
      expect(setter.typeParameters).toEqual([]);
      expect(setter.parameters?.length).toBe(1);
      if (setter.parameters)
      {
        const firstParam = setter.parameters[0];
        expect(firstParam.name).toBe("newValue");
        expect(firstParam.type).toBe("T");
      }
    });

    it("MethodSignature of a TypeLiteral", () => {
      const typeLiteral = getAliasTypeNodeByName<
        ts.SyntaxKind.TypeLiteral
      >("NumberStringType", ts.SyntaxKind.TypeLiteral);

      const members = typeLiteral.getMembers();
      const firstMethod = members[0].asKindOrThrow(
        ts.SyntaxKind.MethodSignature
      ).getStructure();
      const { typeParameters, parameters, returnType } = firstMethod;

      {
        expect(typeParameters?.length).withContext("typeParameters should be a single-element array").toBe(1);
        if (!typeParameters?.length)
          return;

        const firstType = typeParameters[0] as ts.OptionalKind<ts.TypeParameterDeclarationStructure>;
        expect(firstType.name).toBe("S");
        expect(firstType.constraint).toBe("string");
      }

      {
        expect(parameters?.length).withContext("parameters should be a two-element array").toBe(2);
        if (!parameters)
          return;

        const firstArg = parameters[0];
        expect(firstArg.name).toBe("s");
        expect(firstArg.type).toBe("S");
        expect(firstArg.initializer).toBe(undefined);

        const secondArg = parameters[1];
        expect(secondArg.name).toBe("n");
        expect(secondArg.type).toBe("number");
        expect(secondArg.initializer).toBe(undefined);
      }

      expect(returnType).withContext("returnType should be 'string'").toBe("string");
    });

    xit("Symbol keys appear with a ComputedPropertyName", () => {
      const decl = BasicTypes.getTypeAliasOrThrow("TypeHasSymbolKey")
      const typeNode = decl.getTypeNode();
      if (!ts.Node.isTypeLiteral(typeNode))
        throw new Error("expected TypeLiteralNode");

    });

    xdescribe("TypeReference nodes", () => {

    });

    it("Mapped types", () => {
      /*
From https://www.typescriptlang.org/docs/handbook/2/mapped-types.html,
"A mapped type is a generic type which uses a union of PropertyKeys (frequently
created via a keyof) to iterate through keys to create a type."

Each PropertyKey is a string, number, or symbol.

Mapped types take the form:
type objectMirrored = {
  [ key in keyof someOtherType ]: someOtherType[key];
};

Given:
type someOtherType = {
  foo: unknown;
  bar: string;
  [SymbolKey]: boolean;
}

I want to generate (at least in this phase) a structure for:

type objectMirrored = {
  "foo": someOtherType["foo"];
  "bar": someOtherType["bar"];
  [SymbolKey]: someOtherType[SymbolKey];
};

I can resolve the indexed properties in a later phase.

So, here's how this works:

I.   Extract the source code behind the mapped type node as templateText.
II.  The type parameter node ("key" in the above example) has reference nodes.
     We convert those to start and end positions in the template text to replace.
III. The type parameter node also has the constraint node ("keyof someOtherType"
     in the above example), which is a union type of strings, numbers, and symbols.
     We extract the literal types from this as keys.
IV.  Let finalTypeText = "{\n". For each key in keys:
  A. Let keyText be templateText.
  B. For each pair of start and end positions, in reverse order:
    1. Replace the text in keyText between the start and end positions with the key identifier's name.
  C. Append `${key}: ${keyText};\n` to finalTypeText.
V.   Append "};" to finalTypeText.
VI.  finalTypeText now represents a LiteralType which can replace the MappedType as a structure.
       */
      let mappedTypeNode: ts.MappedTypeNode;
      {
        // Setting up.  In the actual implementation, I won't have the type alias name here.
        const alias = BasicTypes.getTypeAliasOrThrow("FiniteProperties");
        mappedTypeNode = alias.getTypeNodeOrThrow().asKindOrThrow(ts.SyntaxKind.MappedType);
      }

      const mappedTypeNodeStart = mappedTypeNode.getStart(true);

      const structure: ts.TypeAliasDeclarationStructure = (
        mappedTypeNode.getParentOrThrow()
                      .asKindOrThrow(ts.SyntaxKind.TypeAliasDeclaration)
                      .getStructure()
      );
      expect(structure.type).not.toBe("");

      // Where TypeScript plugs in the identifier.
      const subTypeNode = mappedTypeNode.getTypeNodeOrThrow();
      const subTypeNodeStart = subTypeNode.getStart(true);

      // The template to populate.
      const templateText: string = structure.type.toString().substring(
        subTypeNode.getStart(true) - mappedTypeNodeStart,
        subTypeNode.getEnd() - mappedTypeNodeStart
      );

      // #region reference offsets
      type startAndEnd = { start: number, end: number };

      // The substring locations in template text to replace with each key.
      const referenceOffsets: startAndEnd[] = (
        mappedTypeNode.getTypeParameter()
                      .getFirstChildByKindOrThrow(ts.SyntaxKind.Identifier)
                      .findReferencesAsNodes()
                      .map(getTextOffsets)
                      .reverse()
      );

      function getTextOffsets(node: ts.Node) : startAndEnd
      {
        return {
          start: node.getStart(true) - subTypeNodeStart,
          end: node.getEnd() - subTypeNodeStart
        };
      }
      // #endregion reference offsets

      // #region keys to replace in the template.
      const keys: ReadonlyArray<string> = (
        mappedTypeNode.getTypeParameter()
                      .getConstraintOrThrow()
                      .getType()
                      .getUnionTypes()
                      .map(getKeyFromChildType)
      );

      function getKeyFromChildType(childType: ts.Type) : string
      {
        // childType represents a string or a number
        const result = (childType.getLiteralValue() as string);
        if (result)
          return `"${result}"`;

        // childType represents a symbol
        return `[${childType.getSymbolOrThrow().getEscapedName()}]`;
      }
      // #endregion keys to replace in the template.

      const extrapolatedFields: string = keys.map(key => {
        let text = templateText;
        const replacement = key.replace(/^\[(.*)\]$/, "$1");
        referenceOffsets.forEach(({start, end}) => {
          text = text.substring(0, start) + replacement + text.substring(end);
        })
        return `  ${key}: ${text};`;
      }).join("\n");

      structure.type = `{\n${extrapolatedFields}\n}`;
      expect(structure.type).withContext("generated structure type").toBe(
`{
  "foo": objectIntersectionType[\`\${"foo"}Object\`];
  "bar": objectIntersectionType[\`\${"bar"}Object\`];
}`);
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
