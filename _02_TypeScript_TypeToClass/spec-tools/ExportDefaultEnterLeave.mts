// #region imports
import path from "path";
import fs from "fs/promises";
import url from "url";

import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

import DecideEnumTraversal, {
  Decision
} from "../../_01_TypeScript_ESTree/source/DecideEnumTraversal.mjs";

import type {
  TSNode_DiscriminatedCallbacks
} from "../../_01_TypeScript_ESTree/source/ESTreeEnterLeaveBase.mjs";

import ESTreeParser from "../../_01_TypeScript_ESTree/source/ESTreeParser.mjs";
import ESTreeTraversal from "../../_01_TypeScript_ESTree/source/ESTreeTraversal.mjs";

import ESTreeErrorUnregistered from "../../_01_TypeScript_ESTree/source/ESTreeErrorUnregistered.mjs";

// #endregion imports

export type FieldsSet = ReadonlyArray<
  TSESTree.TSESTree.MethodDefinition |
  TSESTree.TSESTree.PropertyDefinition
>;

const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");

const ExportDefaultDecision = DecideEnumTraversal.buildTypeDecider();
ExportDefaultDecision.runFilter(
  [
    AST_NODE_TYPES.ExportDefaultDeclaration,
    AST_NODE_TYPES.MethodDefinition
  ],
  true,
  Decision.Accept
);
ExportDefaultDecision.finalize(Decision.Skip);

class ExportDefaultEnterLeave
extends ESTreeErrorUnregistered
implements Pick<
  TSNode_DiscriminatedCallbacks,
  "enterExportDefaultDeclaration" |
  "leaveExportDefaultDeclaration" |
  "enterMethodDefinition" |
  "enterPropertyDefinition"
>
{
  #classFields: (
    TSESTree.TSESTree.MethodDefinition |
    TSESTree.TSESTree.PropertyDefinition
   )[] = [];

  classFields: FieldsSet;

  constructor() {
    super();
    this.classFields = this.#classFields;
  }

  #inExportDefault = false;
  enterExportDefaultDeclaration(
    n: TSESTree.TSESTree.ExportDefaultDeclaration
  ) : boolean
  {
    void(n);

    this.#inExportDefault = true;
    return true;
  }

  leaveExportDefaultDeclaration(
    n: TSESTree.TSESTree.ExportDefaultDeclaration
  ) : void
  {
    void(n);
    this.#inExportDefault = false;
  }

  enterMethodDefinition(
    n: TSESTree.TSESTree.MethodDefinition
  ) : boolean
  {
    if (this.#inExportDefault)
      this.#classFields.push(n);

    return this.#inExportDefault;
  }

  enterPropertyDefinition(
    n: TSESTree.TSESTree.PropertyDefinition
  ) : boolean
  {
    if (this.#inExportDefault)
      this.#classFields.push(n);

    return this.#inExportDefault;
  }

  enter(
    n: TSESTree.TSESTree.Node
  ) : boolean
  {
    switch (n.type)
    {
      case "ExportDefaultDeclaration":
        return this.enterExportDefaultDeclaration(n);
      case "MethodDefinition":
        return this.enterMethodDefinition(n);
      case "PropertyDefinition":
        return this.enterPropertyDefinition(n);
    }

    return super.enter(n);
  }

  leave(
    n: TSESTree.TSESTree.Node
  ) : void
  {
    if (n.type === "ExportDefaultDeclaration")
      return this.leaveExportDefaultDeclaration(n);
    if ((n.type === "MethodDefinition") ||
        (n.type === "PropertyDefinition"))
      return;

    return super.leave(n);
  }
}

export default async function getFields(
  leafName: string
) : Promise<FieldsSet>
{
  const pathToModule = path.resolve(parentDir, "spec-generated", leafName)
  const sourceCode = await fs.readFile(pathToModule, { encoding: "utf-8" });

  const { ast } = ESTreeParser(sourceCode, {
    filePath: pathToModule,
  });

  const enterLeave = new ExportDefaultEnterLeave;

  const traversal = new ESTreeTraversal(ast, ExportDefaultDecision);
  traversal.traverseEnterAndLeave(ast, enterLeave);

  enterLeave.analyze();
  return enterLeave.classFields;
}
