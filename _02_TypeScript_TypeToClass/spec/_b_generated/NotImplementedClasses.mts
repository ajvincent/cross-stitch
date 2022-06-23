import path from "path";
import url from "url";

import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/typescript-estree";
import ExportDefaultFields from "../../spec-tools/ExportDefaultEnterLeave.mjs";

const specGeneratedDir = path.resolve(url.fileURLToPath(import.meta.url), "../../../spec-generated");

type PropertyMetadata = {
  type: (
    AST_NODE_TYPES.PropertyDefinition |
    AST_NODE_TYPES.MethodDefinition
  );
  static: boolean;
  isPrivate: boolean;
};

type MethodMetadata = PropertyMetadata & {
  type: AST_NODE_TYPES.MethodDefinition
  kind: "constructor" | "method" | "get" | "set";
};

type FieldMatchers = {
  toBeMethodDefinition(matchersUtil: jasmine.MatchersUtil) : jasmine.CustomMatcher
  toBePropertyDefinition(matchersUtil: jasmine.MatchersUtil) : jasmine.CustomMatcher;
};

const customMatcher: FieldMatchers =
{
  toBeMethodDefinition(matchersUtil: jasmine.MatchersUtil) : jasmine.CustomMatcher
  {
    void(matchersUtil);
    return {
      compare(
        actual: TSESTree.Node, expected: MethodMetadata
      ) : jasmine.CustomMatcherResult
      {
        if (actual.type !== "MethodDefinition") {
          return {
            pass: false,
            message: `Expected node of type "MethodDefinition", got type "${actual.type}"`
          }
        }

        return {
          pass: (
            (actual.kind === expected.kind) &&
            (actual.static === expected.static) &&
            (actual.key.type === (expected.isPrivate ? "PrivateIdentifier" : "Identifier"))
          ),
          message: `Expected node to have kind ${expected.kind}, static ${expected.static}, isPrivate ${expected.isPrivate}`
        };
      }
    }
  },

  toBePropertyDefinition(matchersUtil: jasmine.MatchersUtil) : jasmine.CustomMatcher
  {
    void(matchersUtil);
    return {
      compare(
        actual: TSESTree.Node, expected: PropertyMetadata
      ) : jasmine.CustomMatcherResult
      {
        if (actual.type !== "PropertyDefinition") {
          return {
            pass: false,
            message: `Expected node of type "PropertyDefinition", got type "${actual.type}"`
          }
        }

        return {
          pass: (
            (actual.static === expected.static) &&
            (actual.key.type === (expected.isPrivate ? "PrivateIdentifier" : "Identifier"))
          ),
          message: `Expected node to have static ${expected.static}, isPrivate ${expected.isPrivate}`
        };
      }
    }
  }
};

type AddedCustomMatcher<T extends jasmine.CustomMatcherFactories> = {
  [P in keyof T]: (expected: Parameters<ReturnType<T[P]>["compare"]>[1]) => void;
}

type FieldMatcherMethods = AddedCustomMatcher<FieldMatchers>;

describe(`Generated "not-implemented" classes have correct methods and properties: `, () => {
  beforeEach(() => jasmine.addMatchers(customMatcher));

  it(`NST_NotImplemented.mts expects ["repeatForward", "repeatBack"]`, async () => {
    // code generation
    const nodes = await ExportDefaultFields("NST_NotImplemented.mts");

    expect(nodes.map(n => (n.key as TSESTree.Identifier).name)).toEqual([
      "repeatForward",
      "repeatBack",
    ]);

    const [repeatForward, repeatBack] = nodes;

    // eslint-disable-next-line
    (expect(repeatForward) as jasmine.Matchers<any> & FieldMatcherMethods).toBeMethodDefinition({
      type: AST_NODE_TYPES.MethodDefinition,
      static: false,
      isPrivate: false,
      kind: "method"
    });

    // eslint-disable-next-line
    (expect(repeatBack) as jasmine.Matchers<any> & FieldMatcherMethods).toBeMethodDefinition({
      type: AST_NODE_TYPES.MethodDefinition,
      static: false,
      isPrivate: false,
      kind: "method"
    });

    // implementation
    const NST_NotImplemented = (await import(path.join(specGeneratedDir, "NST_NotImplemented.mjs"))).default;
    const NST = new NST_NotImplemented;
    expect(
      () => NST.repeatForward("foo", 3)
    ).toThrowError("not yet implemented");
    expect(
      () => NST.repeatBack(3, "foo")
    ).toThrowError("not yet implemented");
  });

  it(`NST_NotImplemented_Partial.mts expects ["repeatForward"]`, async () => {
    // code generation
    const nodes = await ExportDefaultFields("NST_NotImplemented_Partial.mts");

    expect(nodes.map(n => (n.key as TSESTree.Identifier).name)).toEqual([
      "repeatForward",
    ]);

    const [repeatForward] = nodes;

    // eslint-disable-next-line
    (expect(repeatForward) as jasmine.Matchers<any> & FieldMatcherMethods).toBeMethodDefinition({
      type: AST_NODE_TYPES.MethodDefinition,
      static: false,
      isPrivate: false,
      kind: "method"
    });

    // implementation
    const NST_NotImplemented_Partial = (await import(path.join(specGeneratedDir, "NST_NotImplemented_Partial.mjs"))).default;
    const NST = new NST_NotImplemented_Partial;
    expect(
      () => NST.repeatForward("foo", 3)
    ).toThrowError("not yet implemented");
  });

  it(`NST_Bar_NotImplemented.mts expects ["repeatForward", "repeatBack", "repeatBar"]`, async () => {
    // code generation
    const nodes = await ExportDefaultFields("NST_Bar_NotImplemented.mts");

    expect(nodes.map(n => (n.key as TSESTree.Identifier).name)).toEqual([
      "repeatForward",
      "repeatBack",
      "repeatBar",
    ]);

    const [repeatForward, repeatBack, repeatBar] = nodes;

    // eslint-disable-next-line
    (expect(repeatForward) as jasmine.Matchers<any> & FieldMatcherMethods).toBeMethodDefinition({
      type: AST_NODE_TYPES.MethodDefinition,
      static: false,
      isPrivate: false,
      kind: "method"
    });

    // eslint-disable-next-line
    (expect(repeatBack) as jasmine.Matchers<any> & FieldMatcherMethods).toBeMethodDefinition({
      type: AST_NODE_TYPES.MethodDefinition,
      static: false,
      isPrivate: false,
      kind: "method"
    });

    // eslint-disable-next-line
    (expect(repeatBar) as jasmine.Matchers<any> & FieldMatcherMethods).toBeMethodDefinition({
      type: AST_NODE_TYPES.MethodDefinition,
      static: false,
      isPrivate: false,
      kind: "method"
    });

    // implementation
    const NST_Bar_NotImplemented = (await import(path.join(specGeneratedDir, "NST_Bar_NotImplemented.mjs"))).default;
    const NST = new NST_Bar_NotImplemented;
    expect(
      () => NST.repeatForward("foo", 3)
    ).toThrowError("not yet implemented");
    expect(
      () => NST.repeatBack(3, "foo")
    ).toThrowError("not yet implemented");
    expect(
      () => NST.repeatBar(3)
    ).toThrowError("not yet implemented");
  });
});
