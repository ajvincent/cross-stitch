import path from "path";
import url from "url";

const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");

import Driver from "../source/Driver.mjs";
import { ClassSourcesNotImplemented } from "../source/ClassSources.mjs";
import { TSMethodSignature, TSPropertySignature } from "@typescript-eslint/types/dist/generated/ast-spec.js";

export default async function(generatedDir: string) : Promise<void>
{
  await buildNST_NotImplemented(generatedDir);
  await buildNST_NotImplemented_Partial(generatedDir);
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

class NotImplemented_Partial extends ClassSourcesNotImplemented
{
  #omitFields: ReadonlySet<string>;
  constructor(omit: string[]) {
    super();
    this.#omitFields = new Set(omit);
  }

  defineMethod(
    methodName: string,
    signatureSource: string,
    node: TSMethodSignature
  ): boolean
  {
    if (this.#omitFields.has(methodName))
      return false;
    return super.defineMethod(methodName, signatureSource, node);
  }

  defineProperty(
    propertyName: string,
    signatureSource: string,
    node: TSPropertySignature
  ): boolean
  {
    if (this.#omitFields.has(propertyName))
      return false;
    return super.defineProperty(propertyName, signatureSource, node);
  }
}

async function buildNST_NotImplemented_Partial(
  generatedDir: string
) : Promise<void>
{
  const sourceLocation = path.resolve(parentDir, "fixtures/NumberStringType.mts");
  const targetLocation = path.resolve(generatedDir, "NST_NotImplemented_Partial.mts");

  const classSources = new NotImplemented_Partial(["repeatForward"]);
  const driver = new Driver(
    targetLocation,
    "NST_NotImplemented",
    classSources
  );

  driver.implements("NumberStringType", sourceLocation);
  await driver.run();
}
