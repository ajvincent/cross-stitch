import path from "path";
import fs from "fs/promises";
import { DefaultMap } from "../../_00_shared_utilities/source/DefaultMap.mjs"

const FileCacheMap = new DefaultMap<string, Promise<string>>;

export default async function FileCache(pathToModule: string) : Promise<string>
{
  const fullPath = path.normalize(path.resolve(pathToModule));
  return FileCacheMap.getDefault(
    fullPath,
    () => fs.readFile(fullPath, { encoding: "utf-8"})
  );
}
