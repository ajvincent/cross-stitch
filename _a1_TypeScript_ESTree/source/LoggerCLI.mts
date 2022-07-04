/**
 * Move along, nothing to see here.
 */

import fs from "fs/promises";
import path from "path";
import process from "process";

import ESTreeLogger from "./ESTreeLogger.mjs";

const pathToModule = path.normalize(path.resolve(
  process.cwd(), process.argv[2]
));
const sourceContents = await fs.readFile(pathToModule, { encoding: "utf-8" });
const logger = new ESTreeLogger();
logger.run(sourceContents);
