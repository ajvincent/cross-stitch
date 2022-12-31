import ts from "ts-morph";
export default class CodeBlockTemporary {
  readonly #sourceFile: ts.SourceFile;
  readonly #statementBlock: ts.Block;

  static #typeAliasCounter = 0;
  #hasFinalized = false;

  constructor(sourceFile: ts.SourceFile)
  {
    this.#sourceFile = sourceFile;
    this.#statementBlock = this.#sourceFile.addStatements("{\n}")[0].asKindOrThrow(ts.SyntaxKind.Block);
  }

  addTypeAlias(type: string | ts.WriterFunction) : ts.TypeAliasDeclaration
  {
    if (this.#hasFinalized)
      throw new Error("This code block has already finalized!");

    const name = "CODEBLOCK_TEMPORARY_" + (CodeBlockTemporary.#typeAliasCounter++).toString(10).padStart(6, "0");
    return this.#statementBlock.addTypeAlias({ name, type });
  }

  finalize() : void
  {
    if (this.#hasFinalized)
      return;
    this.#hasFinalized = true;
    this.#statementBlock.remove();
  }
}
