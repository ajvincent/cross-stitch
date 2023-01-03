import ts from "ts-morph";

import { BasicTypes } from "../../_00_shared_utilities/spec-utilities/BasicTypesSource.mjs";
import findTarget from "../source/findTarget.mjs";

import * as AliasTypeBuilders from "../../_01_alias_type_builders/exports.mjs";

describe("findTarget", () => {
  describe("with printerKind: Identifier", () => {
    describe("finds all of an interface's members", () => {
      it("for two declarations", () => {
        const printer = new AliasTypeBuilders.Identifier("FooInterface");
        const results = findTarget(BasicTypes, printer);

        expect(results.memberTypes.length).toBe(2);
        const [firstMember, secondMember] = results.memberTypes;

        const isFirstProperty = ts.Node.isPropertySignature(firstMember);
        expect(isFirstProperty).toBe(true);
        if (isFirstProperty) {
          expect(firstMember.getName()).toBe("foo");
        }

        const isSecondProperty = ts.Node.isPropertySignature(secondMember);
        expect(isSecondProperty).toBe(true);
        if (isSecondProperty) {
          expect(secondMember.getName()).toBe("foo2");
        }
      });

      it("through one alias", () => {
        const printer = new AliasTypeBuilders.Identifier("FooInterfaceAlias");

        const results = findTarget(BasicTypes, printer);

        expect(results.memberTypes.length).toBe(2);
        const [firstMember, secondMember] = results.memberTypes;

        const isFirstProperty = ts.Node.isPropertySignature(firstMember);
        expect(isFirstProperty).toBe(true);
        if (isFirstProperty) {
          expect(firstMember.getName()).toBe("foo");
        }

        const isSecondProperty = ts.Node.isPropertySignature(secondMember);
        expect(isSecondProperty).toBe(true);
        if (isSecondProperty) {
          expect(secondMember.getName()).toBe("foo2");
        }
      });
    });

    xit("finds a TypeLiteral through one alias", () => {
      expect(1).toBe(1);
    });

    xit("finds a TypeLiteral through two aliases", () => {
      expect(1).toBe(1);
    });

    xit("throws for an identifier it can't find", () => {
      expect(1).toBe(1);
    });
  
    xit("throws for a type alias that isn't to a type literal or interface", () => {
      expect(1).toBe(1);
    });
  });
});
