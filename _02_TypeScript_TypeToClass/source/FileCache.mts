import path from "path";
import url from "url";
import fs from "fs/promises";
import { DefaultMap } from "../../_00_shared_utilities/source/DefaultMap.mjs";

const FileCacheMap = new DefaultMap<string, Promise<string>>;

export default async function FileCache(
  startLocation: ImportMeta | string,
  allowNotMTS = false
) : Promise<string>
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

  const extension = path.extname(localFileLocation);
  if (!allowNotMTS && (extension !== ".mts"))
    throw new Error(`FileCache invoked with "${extension}, expecting ".mts".  If correct, pass in allowNotMTS = true as the third argument.`);

  return FileCacheMap.getDefault(
    hrefToLocation,
    () => fs.readFile(localFileLocation, { encoding: "utf-8"})
  );
}
