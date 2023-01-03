import fs from "fs/promises";

import path from "path";
import url from "url";

const generatedDir = path.join(url.fileURLToPath(import.meta.url), "../../spec-generated");

await fs.rm(generatedDir, { force: true, recursive: true });
await fs.mkdir(generatedDir);

await import(
  path.join(url.fileURLToPath(import.meta.url), "../targets", process.argv[2])
);
