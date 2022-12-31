import ts from "ts-morph";
import CodeBlockTemporary from "../source/CodeBlock-Temporary.mjs";

it("CodeBlock-Temporary creates temporary statement blocks", () => {
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
    },

    useInMemoryFileSystem: true
  });

  const sourceFile = project.createSourceFile("temp.mts", `
const KeySymbol = Symbol("key");
type OneTwoKeyLiteral = {
  one: false;
  two: false;
  [KeySymbol]: "key";
};
`.trim() + "\n");

  const block = new CodeBlockTemporary(sourceFile);

  const firstAlias = block.addTypeAlias(`"foo"`);
  expect(firstAlias.getTypeNode()?.asKindOrThrow(ts.SyntaxKind.LiteralType).getText()).toBe('"foo"');

  expect(sourceFile.getTypeAlias(firstAlias.getName())).toBe(undefined);

  block.finalize();
  expect(
    () => firstAlias.getTypeNode()
  ).toThrow();
});
