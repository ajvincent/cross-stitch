/**
 * Move along, nothing to see here.
 */

import process from "process";
import FileCache from "./FileCache.mjs";
import ESTreeLogger from "./ESTreeLogger.mjs";

const pathToModule = process.argv[2];
const sourceContents = await FileCache(
  process.cwd(),
  pathToModule
);
const logger = new ESTreeLogger();
logger.run(sourceContents);
