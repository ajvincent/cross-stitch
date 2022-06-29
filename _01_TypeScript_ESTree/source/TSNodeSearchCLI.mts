import fs from "fs/promises";
import path from "path";
import url from "url";
import process from "process";

import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";
type TSNode = TSESTree.TSESTree.Node;

import readDirsDeep from "../../_00_shared_utilities/source/readDirsDeep.mjs";
import {
  PromiseAllParallel, PromiseAllSequence
} from "../../_00_shared_utilities/source/PromiseTypes.mjs";

import ESTreeParser, { ParseForESLintResult } from "./ESTreeParser.mjs";
import DecideEnumTraversal, { Decision } from "./DecideEnumTraversal.mjs";
import ESTreeTraversal, { ESTreeEnterLeave } from "./ESTreeTraversal.mjs";

const targetType = process.argv[2];

if (!(targetType in AST_NODE_TYPES))
  throw new Error("Unknown target type: " + targetType);

const filesParsed = await (async () : Promise<[string, ParseForESLintResult][]> =>
{
  const PROJECT_ROOT = path.resolve(
    url.fileURLToPath(import.meta.url), "../../.."
  );

  const stageDirs = (
    await fs.readdir(PROJECT_ROOT, { encoding: "utf-8" })
  ).filter(
    f => (/^_\d\d_/.test(f)) || f === "build"
  );

  const fileList = (await PromiseAllParallel(stageDirs, async (dir) => {
    const { files } = await readDirsDeep(dir);
    return files.filter(f => /(?<!\.d)\.mts$/.test(f));
  })).flat();

  return await PromiseAllParallel(
    fileList,
    async file => {
      const contents = await fs.readFile(file, { encoding: "utf-8" });
      const astAndScopes = ESTreeParser(contents);
      return [file, astAndScopes];
    }
  );
})();

const decider = DecideEnumTraversal.buildTypeDecider();
decider.runFilter([targetType as AST_NODE_TYPES], true, Decision.Accept);
decider.finalize(Decision.Skip);

class EnterLeaveFile implements ESTreeEnterLeave
{
  #fileName: string;
  #logged = false;
  constructor(fileName: string) {
    this.#fileName = fileName;
  }

  enter(n: TSNode) : boolean
  {
    void(n);
    if (!this.#logged) {
      this.#logged = true;
      console.log(this.#fileName);
    }
    return true;
  }

  leave(n: TSNode) : void
  {
    void(n);
  }
}

await PromiseAllSequence(filesParsed, async ([fileName, astAndScope]) => {
  const observer = new EnterLeaveFile(fileName);
  const traversal = new ESTreeTraversal(astAndScope.ast, decider);

  traversal.traverseEnterAndLeave(astAndScope.ast, observer);
});
