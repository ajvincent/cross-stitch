import path from "path";
import url from "url";
import fs from "fs/promises";

import ProjectDriver from "../../_02_passthrough_types/source/ProjectDriver.mjs";

const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");

export default async function() : Promise<void>
{
  await fs.rm(
    path.join(parentDir, "fixtures/generated"),
    {
      force: true,
      recursive: true
    }
  );

  await ProjectDriver(path.join(parentDir, "fixtures/NumberString-project.json"));
}
