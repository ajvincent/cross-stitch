import path from "path";
import url from "url";
import fs from "fs/promises";

import { DefaultMap } from "../../_00_shared_utilities/source/DefaultMap.mjs";
import ESTreeParser from "../../_01_TypeScript_ESTree/source/ESTreeParser.mjs";

import type {
  AST, TSESTreeOptions
} from "@typescript-eslint/typescript-estree";

function normalizeLocations(startLocation: ImportMeta | string) : [string, string]
{
  let hrefToLocation: string, localFileLocation: string;
  if (typeof startLocation === "string") {
    localFileLocation = path.normalize(path.resolve(
      process.cwd(), startLocation
    ))
    hrefToLocation = url.pathToFileURL(localFileLocation).href;
  }
  else {
    hrefToLocation = startLocation.url;
    localFileLocation = url.fileURLToPath(hrefToLocation);
  }

  return [hrefToLocation, localFileLocation];
}

const FileCacheMap = new DefaultMap<string, Promise<string>>;

export async function FileCache(
  startLocation: ImportMeta | string,
  allowNotMTS = false
) : Promise<string>
{
  const [hrefToLocation, localFileLocation] = normalizeLocations(startLocation);

  return FileCacheMap.getDefault(
    hrefToLocation,
    () => {
      const extension = path.extname(localFileLocation);
      if (!allowNotMTS && (extension !== ".mts"))
        throw new Error(`FileCache invoked with "${extension}, expecting ".mts".  If correct, pass in allowNotMTS = true as the third argument.`);
      return fs.readFile(localFileLocation, { encoding: "utf-8"});
    }
  );
}

const ASTCacheMap :DefaultMap<string, Promise<AST<TSESTreeOptions>>> = new DefaultMap;

export async function ASTCache(
  startLocation: ImportMeta | string,
  allowNotMTS = false
) : Promise<AST<TSESTreeOptions>>
{
  const [hrefToLocation, localFileLocation] = normalizeLocations(startLocation);

  return ASTCacheMap.getDefault(
    hrefToLocation,
    async () => {
      const source = await FileCache(startLocation, allowNotMTS);
      return ESTreeParser(source, {
        filePath: localFileLocation
      });
    }
  )
}
