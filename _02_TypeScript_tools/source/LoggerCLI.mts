import process from "process";
import path from "path";
import ESTreeLogger from "./ESTreeLogger.mjs";

const pathToModule = path.resolve(process.cwd(), process.argv[2]);
const logger = new ESTreeLogger(pathToModule);
await logger.run();
