import MultiFileParser, {
  SourceCode_AST_ScopeManager
} from "../source/MultiFileParser.mjs";

import path from "path";
import url from "url";

const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");
const tsconfigJSON = path.join(parentDir, "tsconfig.json");

const VariableLookupsPath = path.resolve(parentDir, "fixtures/VariableLookups.mts");
const SimpleStringPath = path.resolve(parentDir, "fixtures/SimpleStringType.mts");

describe("MultiFileParser", () => {
  const parser = new MultiFileParser(
    tsconfigJSON,
    parentDir
  );
  let astAndSource: SourceCode_AST_ScopeManager;
  beforeAll(async () => {
    astAndSource = await parser.getSourcesAndAST(
      VariableLookupsPath
    );
  });

  it(
    ".getSourcesAndAST() gets the same AST root node for the same location",
    async () => {
      const astAndSource2 = await parser.getSourcesAndAST(
        VariableLookupsPath
      );

      expect(astAndSource2).toBe(astAndSource);
    }
  );

  describe(".getTypeAliasesByIdentifier()", () => {
    it("finds a single type node for a matching ID", () => {
      const nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Wop_1"
      );

      expect(nodes).not.toBe(undefined);
      if (!nodes)
        return;

      expect(nodes.length).toBe(1);
      if (nodes.length < 1)
        return;

      const [n0] = nodes;
      expect(n0.type).toBe("TSTypeAliasDeclaration");
      if (n0.type === "TSTypeAliasDeclaration") {
        expect(n0.id.name).toBe("Wop_1");
      }
    });

    it("finds two interface nodes for a matching ID", () => {
      const nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Wop_0"
      );

      expect(nodes).not.toBe(undefined);
      if (!nodes)
        return;

      expect(nodes.length).toBe(2);
      if (nodes.length < 2)
        return;

      const [n0, n1] = nodes;
      expect(n0.type).toBe("TSInterfaceDeclaration");
      if (n0.type === "TSInterfaceDeclaration")
      {
        expect(n0.id.name).toBe("Wop_0");
      }

      expect(n1.type).toBe("TSInterfaceDeclaration");
      if (n1.type === "TSInterfaceDeclaration")
      {
        expect(n1.id.name).toBe("Wop_0");
      }
    });

    it("finds a single import specifier for a matching ID", () => {
      const nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Foo_0"
      );

      expect(nodes).not.toBe(undefined);
      if (!nodes)
        return;

      expect(nodes.length).toBe(1);
      if (nodes.length < 1)
        return;

      const [n0] = nodes;
      expect(n0.type).toBe("ImportSpecifier");
      if (n0.type === "ImportSpecifier")
        expect(n0.local.name).toBe("Foo_0");

      const importLine = n0.parent;
      expect(importLine).not.toBe(undefined)
      if (!importLine)
        return;

      expect(importLine.type).toBe("ImportDeclaration");
      if (importLine.type !== "ImportDeclaration")
        return;

      expect(importLine.source.value).toBe("./SimpleStringType.mjs");
    });

    it("finds no nodes for a non-matching ID", () => {
      const nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Unknown_Id"
      );

      expect(nodes).toEqual(undefined);
    });
  });

  describe(".dereferenceIdentifier()", () => {
    it("finds a single type node for an inline type alias", async () => {
      const Bar_0_nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Bar_0"
      );
      if (!Bar_0_nodes)
        return fail("Bar_0 has no type alias nodes");

      const Bar_1_nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Bar_1"
      );
      if (!Bar_1_nodes)
        return fail("Bar_1 has no type alias nodes");
      const Bar_1 = Bar_1_nodes[0];
      if (Bar_1.type !== "TSTypeAliasDeclaration")
        return fail("Bar_1 has no type alias nodes");

      const reference = Bar_1.typeAnnotation;
      expect(reference.type).toBe("TSTypeReference");
      if (reference.type !== "TSTypeReference")
        return;

      const dereferenced = await parser.dereferenceIdentifier(reference, false);
      expect(dereferenced).toEqual(Bar_0_nodes);
    });

    it("finds two interface nodes for an inline type alias", async () => {
      const Wop_0_nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Wop_0"
      );
      if (!Wop_0_nodes)
        return fail("Wop_0 has no interface nodes");

      const Wop_1_nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Wop_1"
      );
      if (!Wop_1_nodes)
        return fail("Wop_1 has no type alias nodes");
      const Wop_1 = Wop_1_nodes[0];
      if (Wop_1.type !== "TSTypeAliasDeclaration")
        return fail("Wop_1 has no type alias nodes");

      const reference = Wop_1.typeAnnotation;
      expect(reference.type).toBe("TSTypeReference");
      if (reference.type !== "TSTypeReference")
        return;

      const dereferenced = await parser.dereferenceIdentifier(reference, false);
      expect(dereferenced).toEqual(Wop_0_nodes);
    });

    it("finds a single import specifier for an inline type alias", async () => {
      const Foo_0_nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Foo_0"
      );
      if (!Foo_0_nodes)
        return fail("Foo_0 has no import specifier nodes");

      const Foo_1_nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Foo_1"
      );
      if (!Foo_1_nodes)
        return fail("Foo_1 has no type alias nodes");
      const Foo_1 = Foo_1_nodes[0];
      if (Foo_1.type !== "TSTypeAliasDeclaration")
        return fail("Foo_1 has no type alias nodes");

      const reference = Foo_1.typeAnnotation;
      expect(reference.type).toBe("TSTypeReference");
      if (reference.type !== "TSTypeReference")
        return;

      const dereferenced = await parser.dereferenceIdentifier(reference, false);
      expect(dereferenced).toEqual(Foo_0_nodes);
    });

    it("retrieves an imported set of type nodes", async () => {
      const Foo_0_nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Foo_0"
      );
      if (!Foo_0_nodes)
        return fail("Foo_0 has no import specifier nodes");

      const Foo_1_nodes = parser.getTypeAliasesByIdentifier(
        astAndSource.ast,
        "Foo_1"
      );
      if (!Foo_1_nodes)
        return fail("Foo_1 has no type alias nodes");
      const Foo_1 = Foo_1_nodes[0];
      if (Foo_1.type !== "TSTypeAliasDeclaration")
        return fail("Foo_1 has no type alias nodes");

      const reference = Foo_1.typeAnnotation;
      expect(reference.type).toBe("TSTypeReference");
      if (reference.type !== "TSTypeReference")
        return;

      const dereferenced = await parser.dereferenceIdentifier(reference, true);
      expect(dereferenced).not.toEqual(Foo_0_nodes);

      const { ast: exportedAST } = await parser.getSourcesAndAST(
        SimpleStringPath
      );
      const exportedNodes = parser.getTypeAliasesByIdentifier(exportedAST, "Foo");
      expect(exportedNodes).not.toBe(undefined);
      if (exportedNodes)
        expect(dereferenced).toEqual(exportedNodes);
    });
  });
});
