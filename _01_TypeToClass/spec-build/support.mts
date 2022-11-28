import fs from "fs/promises";
import path from "path";
import url from "url";
import { fork } from 'child_process';

import {
  Deferred,
  PromiseAllParallel,
} from "../../_00_shared_utilities/source/PromiseTypes.mjs";

const targetsDir = path.join(url.fileURLToPath(import.meta.url), "../targets");

const modulesList = (await fs.readdir(targetsDir)).filter(
  fileName => fileName.endsWith(".mjs")
).map(fileName => path.join(targetsDir, fileName));

/**
 * Run a specific submodule.
 *
 * @param pathToModule  - The module to run.
 * @param moduleArgs    - Arguments we pass into the module.
 * @param extraNodeArgs - Arguments we pass to node.
 */
function runModule(
  pathToModule: string,
  moduleArgs: string[] = [],
  extraNodeArgs: string[] = []
) : Promise<void>
{
  const d: Deferred<void> = new Deferred;

  const child = fork(pathToModule, moduleArgs, {
    execArgv: process.execArgv.concat(...extraNodeArgs),
    silent: false
  });
  child.on('exit', code => code ? d.reject(code) : d.resolve());

  return d.promise;
}

export default async function () : Promise<void>
{
  await PromiseAllParallel(modulesList, runModule);
}
