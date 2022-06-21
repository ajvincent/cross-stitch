import path from "path";
import url from "url";

const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");

import Driver from "../source/Driver.mjs";
import { ClassSourcesNotImplemented } from "../source/ClassSources.mjs";

export default async function(generatedDir: string) : Promise<void>
{
  await buildNST_NotImplemented(generatedDir);
}

async function buildNST_NotImplemented(
  generatedDir: string
) : Promise<void>
{
  const sourceLocation = path.resolve(parentDir, "fixtures/NumberStringType.mts");
  const targetLocation = path.resolve(generatedDir, "NST_NotImplemented.mts");

  const classSources = new ClassSourcesNotImplemented;
  const driver = new Driver(
    targetLocation,
    "NST_NotImplemented",
    classSources
  );
  driver.implements("NumberStringType", sourceLocation);

  await driver.run();
}
