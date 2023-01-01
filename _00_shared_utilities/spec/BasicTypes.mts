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
 * type ManyProperties = \{
 *   // IndexSignature, https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures
 *   [key: string]: true;
 * \};
 *
 * Those we cannot resolve in TypeToClass.  It's just not possible to generate all the keys
 * which this type matches.
 *
 * So we have to figure out from the type structure if we have a finite set of keys or not.
 * This must happen before we attempt to figure out the type definitions for each key.
 *
 * type FiniteProperties = \{
 *   // MappedType, https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
 *   [key in "foo" | "bar"]: someOtherType;
 * \};
 *
 * Mapped types give us a different sort of trouble.  We might be better off replacing, at least temporarily,
 * the MappedType node with a set of other nodes.  The good news is the claim in the handbook that the
 * type parameter's type operator must be a union of PropertyKey's.  So it's a finite, enumerable set, and
 * we should be able to extract the set easily.
 */
import ts from "ts-morph";

import {
  BasicTypes,
  getAliasTypeNodeByName
} from "../spec-utilities/BasicTypesSource.mjs";

/*
import CodeBlockTemporary from "../source/CodeBlock-Temporary.mjs";
*/

describe("Basic type support from ts-morph: ", () => {
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
    const decl = BasicTypes.getTypeAliasOrThrow("GetterAndSetter");
    const typeParameters = decl.getTypeParameters();
    expect(typeParameters.length).toBe(2);

    const firstTypeParam = typeParameters[0].getStructure();
    expect(firstTypeParam.name).toBe("T");
    expect(firstTypeParam.constraint).toBe("number");

    const secondTypeParam = typeParameters[1].getStructure();
    expect(secondTypeParam.name).toBe("U");
    expect(typeof secondTypeParam.constraint).toBe("undefined");
  });

  // #endregion type aliases

  describe("Interfaces", () => {
    it("report .getType().isObject() === true for a non-empty interface", () => {
      const decl = BasicTypes.getInterfaceOrThrow("FooInterface");
      const type = decl.getType();
      expect(type.isObject()).toBe(true);
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
    void(null);
  });

  describe("Extracting fields of object type aliases and interfaces:", () => {
    it("TypeLiteral", () => {
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
        expect(typeParameters?.length)
          .withContext("typeParameters should be a single-element array")
          .toBe(1);
        if (typeParameters?.length !== 1)
          return;

        const firstType = typeParameters[0] as ts.OptionalKind<ts.TypeParameterDeclarationStructure>;
        expect(firstType.name).toBe("S");
        expect(firstType.constraint).toBe("string");
      }

      {
        expect(parameters?.length)
          .withContext("parameters should be a two-element array")
          .toBe(2);
        if (parameters?.length !== 2)
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

      expect(returnType)
        .withContext("returnType should be 'string'")
        .toBe("string");
    });

    it("Call signatures of a TypeLiteral", () => {
      const typeLiteral = getAliasTypeNodeByName<
        ts.SyntaxKind.TypeLiteral
      >("CallableType", ts.SyntaxKind.TypeLiteral);

      const members = typeLiteral.getMembers();
      expect(members.length).toBe(2);

      {
        const signature = members[0].asKindOrThrow(
          ts.SyntaxKind.CallSignature
        ).getStructure();
        const { typeParameters, parameters, returnType } = signature;

        expect(typeParameters?.length)
          .withContext("typeParameters should be a single-element array")
          .toBe(1);
        if (!typeParameters?.length)
          return;
        const firstType = typeParameters[0] as ts.OptionalKind<ts.TypeParameterDeclarationStructure>;
        expect(firstType.name).toBe("Type");
        expect(firstType.constraint).toBe("string");

        expect(parameters?.length)
          .withContext("parameters should be a one-element array")
          .toBe(2);
        if (parameters?.length !== 1)
          return;

        const firstArg = parameters[0];
        expect(firstArg.name).toBe("x");
        expect(firstArg.type).toBe("Type");
        expect(firstArg.initializer).toBe(undefined);

        expect(returnType)
          .withContext(`returnType should be "NumberStringType"`)
          .toBe("NumberStringType");
      }

      {
        const signature = members[1].asKindOrThrow(
          ts.SyntaxKind.CallSignature
        ).getStructure();
        const { typeParameters, parameters, returnType } = signature;

        expect(typeParameters)
          .withContext("typeParameters should be undefined")
          .toBe(undefined);
        if (typeParameters)
          return;

        expect(parameters?.length)
          .withContext("parameters should be a one-element array")
          .toBe(1);
        if (parameters?.length !== 1)
          return;

        const firstArg = parameters[0];
        expect(firstArg.name).toBe("y");
        expect(firstArg.type).toBe("number");
        expect(firstArg.initializer).toBe(undefined);

        expect(returnType)
          .withContext(`returnType should be "NumberStringType"`)
          .toBe("NumberStringType");
      }
    });

    it("Construct signatures of a TypeLiteral", () => {
      const typeLiteral = getAliasTypeNodeByName<
        ts.SyntaxKind.TypeLiteral
      >("ConstructableType", ts.SyntaxKind.TypeLiteral);

      const members = typeLiteral.getMembers();
      expect(members.length).toBe(2);

      {
        const signature = members[0].asKindOrThrow(
          ts.SyntaxKind.ConstructSignature
        ).getStructure();
        const { typeParameters, parameters, returnType } = signature;

        expect(typeParameters?.length)
          .withContext("typeParameters should be a single-element array")
          .toBe(1);
        if (!typeParameters?.length)
          return;
        const firstType = typeParameters[0] as ts.OptionalKind<ts.TypeParameterDeclarationStructure>;
        expect(firstType.name).toBe("Type");
        expect(firstType.constraint).toBe("string");

        expect(parameters?.length)
          .withContext("parameters should be a one-element array")
          .toBe(2);
        if (parameters?.length !== 1)
          return;

        const firstArg = parameters[0];
        expect(firstArg.name).toBe("x");
        expect(firstArg.type).toBe("Type");
        expect(firstArg.initializer).toBe(undefined);

        expect(returnType)
          .withContext(`returnType should be "NumberStringType"`)
          .toBe("NumberStringType");
      }

      {
        const signature = members[1].asKindOrThrow(
          ts.SyntaxKind.ConstructSignature
        ).getStructure();
        const { typeParameters, parameters, returnType } = signature;

        expect(typeParameters)
          .withContext("typeParameters should be undefined")
          .toBe(undefined);
        if (typeParameters)
          return;

        expect(parameters?.length)
          .withContext("parameters should be a one-element array")
          .toBe(1);
        if (parameters?.length !== 1)
          return;

        const firstArg = parameters[0];
        expect(firstArg.name).toBe("y");
        expect(firstArg.type).toBe("number");
        expect(firstArg.initializer).toBe(undefined);

        expect(returnType)
          .withContext(`returnType should be "NumberStringType"`)
          .toBe("NumberStringType");
      }
    });

    it("Symbol keys appear with a ComputedPropertyName", () => {
      const typeLiteral = getAliasTypeNodeByName<
        ts.SyntaxKind.TypeLiteral
      >("TypeHasSymbolKey", ts.SyntaxKind.TypeLiteral);

      const members = typeLiteral.getMembers();
      const structures = members.map(m => m.getStructure());
      expect(structures.length).toBe(2);

      const [symbolStructure, stringStructure] = structures;

      expect(symbolStructure.kind).withContext(
        "first member should be a PropertySignature"
      ).toBe(ts.StructureKind.PropertySignature);
      if (!ts.Structure.isPropertySignature(symbolStructure))
        return;
      expect(symbolStructure.name).toBe("[SymbolTypeKey]");

      expect(stringStructure.kind)
        .withContext("second member should be a PropertySignature")
        .toBe(ts.StructureKind.PropertySignature);
      if (!ts.Structure.isPropertySignature(stringStructure))
        return;
      expect(stringStructure.name).toBe("\"[SymbolTypeKey]\"");
    });

    it("with other signatures", () => {
      const typeLiteral = getAliasTypeNodeByName<
        ts.SyntaxKind.TypeLiteral
      >("ManyPropertiesWithRequired", ts.SyntaxKind.TypeLiteral);

      const members = typeLiteral.getMembers();
      const structures = members.map(m => m.getStructure());
      expect(structures.length).toBe(2);

      expect(ts.Structure.isIndexSignature(structures[0])).toBe(true);
      expect(ts.Structure.isPropertySignature(structures[1])).toBe(true);
    });

    xdescribe("TypeReference nodes", () => {
      void(null);
    });

    it("We can extract a structure from a mapped type with finite keys", () => {
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
       */
      let mappedTypeNode: ts.MappedTypeNode;
      {
        // Setting up.  In the actual implementation, I won't have the type alias name here.
        const alias = BasicTypes.getTypeAliasOrThrow("FiniteProperties");
        mappedTypeNode = alias.getTypeNodeOrThrow().asKindOrThrow(ts.SyntaxKind.MappedType);
      }

/*
Newer approach:  I found a way to directly get the enumerated declarations.

const mappedProperties = mappedTypeNode.getType().getProperties();
return new Map<ts.Symbol, ts.Node[]>(mappedProperties.map(propertyAsSymbol => [
  propertyAsSymbol,
  propertyAsSymbol.getTypeAtLocation(mappedTypeNode).getSymbolOrThrow().getDeclarations()
]));

*/
      {
        const mappedProperties = mappedTypeNode.getType().getProperties();

        {
          const fooSymbol = mappedTypeNode.getType().getPropertyOrThrow("foo");
          expect(mappedProperties[0])
            .withContext("we should be able to extract all the symbol properties")
            .toBe(fooSymbol);
        }

        // Extracting the name.
        expect(
          mappedProperties[0].getDeclaredType().getFlags() &
          ts.TypeFlags.StringOrNumberLiteral | ts.TypeFlags.UniqueESSymbol
        ).not.toBe(0);
        expect(mappedProperties[0].getEscapedName()).toBe("foo");

        // Extracting the declarations.
        const actualNodes = mappedProperties[0].getTypeAtLocation(mappedTypeNode).getSymbolOrThrow().getDeclarations();
        expect(actualNodes.length).toBe(1);

        {
          const objectWithFooProperty = BasicTypes.getTypeAliasOrThrow("objectWithFooProperty");
          const fooPropertySymbol = objectWithFooProperty.getType().getPropertyOrThrow("fooObject");
          const fooObjectPropertyNode = fooPropertySymbol.getDeclarations()[0].asKindOrThrow(ts.SyntaxKind.PropertySignature);
          const fooObjectTypeNode = fooObjectPropertyNode.getTypeNodeOrThrow();

          expect(actualNodes[0])
            .withContext("we should be able to match a named property")
            .toBe(fooObjectTypeNode);
        }
      }
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
