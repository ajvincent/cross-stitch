/**
 * This file will move to _02_TypeScript_TypeToClass soon.
 * However, LoggerCLI currently relies on it, which it really doesn't need to.
 */

import path from "path";
import url from "url";
import fs from "fs/promises";
import { DefaultMap } from "../../_00_shared_utilities/source/DefaultMap.mjs"

const FileCacheMap = new DefaultMap<string, Promise<string>>;

export default async function FileCache(
  startLocation: ImportMeta | string,
  pathToSource: string,
  allowNotMTS = false
) : Promise<string>
{
  let basePath: string;
  if (typeof startLocation === "string")
    basePath = startLocation;
  else
    basePath = url.fileURLToPath(startLocation.url);

  const fullPath = path.normalize(path.resolve(
    basePath,
    pathToSource
  ));

  if (!allowNotMTS && (path.extname(fullPath) !== ".mts"))
    throw new Error(`FileCache invoked with "${path.extname(fullPath)}, expecting ".mts".  If correct, pass in allowNotMTS = true as the third argument.`);

  return FileCacheMap.getDefault(
    fullPath,
    () => fs.readFile(fullPath, { encoding: "utf-8"})
  );
}
