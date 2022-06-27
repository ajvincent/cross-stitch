import path from "path";
import url from "url";

const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");
const tsconfigJSON = path.join(parentDir, "tsconfig.json");

import Driver from "../source/Driver.mjs";
import { ClassSources, ClassSourcesNotImplemented } from "../source/ClassSources.mjs";
import { TSMethodSignature, TSPropertySignature } from "@typescript-eslint/types/dist/generated/ast-spec.js";

const specGeneratedDir = path.join(parentDir, "spec-generated");
const fixturesDir = path.join(parentDir, "fixtures");

export default async function() : Promise<void>
{
  await Promise.all([
    buildNST_NotImplemented(),
    buildNST_Bar_NotImplemented(),
    buildNST_NotImplemented_Partial(),
    buildTyped(),
    buildHasTypeAttribute(),
  ]);
}

function buildDriver(
  localTargetName: string,
  classSources: ClassSources
) : Driver
{
  const targetLocation = path.resolve(specGeneratedDir, localTargetName);
  const driver = new Driver(
    targetLocation,
    "NST_NotImplemented",
    classSources,
    tsconfigJSON,
    process.cwd()
  );
  return driver;
}

function addFixtureType(
  driver: Driver,
  localFileName: string,
  typeToImplement: string
) : void
{
  const fullFilePath = path.resolve(fixturesDir, localFileName);
  driver.implements(typeToImplement, fullFilePath);
}

async function buildNST_NotImplemented() : Promise<void>
{
  const driver = buildDriver(
    "NST_NotImplemented.mts",
    new ClassSourcesNotImplemented
  );
  addFixtureType(
    driver,
    "NumberStringType.mts",
    "NumberStringType"
  );

  await driver.run();
}

async function buildNST_Bar_NotImplemented() : Promise<void>
{
  const driver = buildDriver(
    "NST_Bar_NotImplemented.mts",
    new ClassSourcesNotImplemented
  );
  addFixtureType(
    driver,
    "NumberStringType.mts",
    "NumberStringType"
  );

  addFixtureType(
    driver,
    "TypePatterns.mts",
    "Bar"
  );

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

async function buildNST_NotImplemented_Partial() : Promise<void>
{
  const driver = buildDriver(
    "NST_NotImplemented_Partial.mts",
    new NotImplemented_Partial(["repeatBack"])
  );
  addFixtureType(
    driver,
    "NumberStringType.mts",
    "NumberStringType"
  );

  await driver.run();
}

async function buildTyped() : Promise<void>
{
  const driver = buildDriver(
    "TypedClass.mts",
    new ClassSourcesNotImplemented
  );
  addFixtureType(
    driver,
    "TypePatterns.mts",
    "IsTypedNST"
  );

  await driver.run();
}

async function buildHasTypeAttribute() : Promise<void>
{
  const driver = buildDriver(
    "HasTypeAttribute.mts",
    new ClassSourcesNotImplemented
  );
  addFixtureType(
    driver,
    "TypePatterns.mts",
    "HasTypeAttribute"
  );

  await driver.run();
}
