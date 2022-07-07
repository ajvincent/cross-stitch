import ts from "ts-morph";

import path from "path";
import url from "url";

const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");

import TypeToClass, {
  FieldDeclaration
} from "../source/TypeToClass.mjs";
import { PromiseAllParallel } from "../../_00_shared_utilities/source/PromiseTypes.mjs";

export default async function() : Promise<void>
{
  const project = new ts.Project({
    compilerOptions: {
      lib: ["es2021"],
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Node16,
      sourceMap: true,
      declaration: true,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    }
  });

  const fixturesDir = project.addDirectoryAtPath(path.join(parentDir, "fixtures"));
  const generatedDir = project.addDirectoryAtPath(path.join(parentDir, "spec-generated"));

  await PromiseAllParallel([
    buildNumberStringTypeClass,
    buildNumberStringInterfaceClass,
    buildIsTypedNST,
    buildNumberStringWithTypeClass,
    buildPartialType,
    buildStringNumberTypeClass,
    buildIsTypedNSTWithConstructor,
    buildNumberStringAndTypeClass,
    throwNumberStringOrBar,
  ], callback => callback(fixturesDir, generatedDir));

  //await buildIsTypedNST(fixturesDir, generatedDir);
}

const notImplemented = `throw new Error("not yet implemented");`;
function notImplementedCallback
(
  classNode: ts.ClassDeclaration,
  propertyName: string | symbol,
  propertyNode: FieldDeclaration,
) : boolean
{
  if (ts.Node.isMethodDeclaration(propertyNode)) {
    propertyNode.addStatements(notImplemented)
  }
  else {
    const returnType = propertyNode.getTypeNodeOrThrow().getText();

    propertyNode.remove();
    if (typeof propertyName === "symbol")
      throw new Error("unexpected symbol property name");

    classNode.addGetAccessor({
      name: propertyName,
      statements: notImplemented,
      returnType,
    });

    classNode.addSetAccessor({
      name: propertyName,
      parameters: [{
        name: "value",
        type: returnType
      }],
      statements: notImplemented
    });
  }

  return true;
}

async function buildNumberStringTypeClass(
  fixturesDir: ts.Directory,
  generatedDir: ts.Directory
) : Promise<void>
{
  const srcFile = fixturesDir.addSourceFileAtPath("NumberStringType.mts");
  const destFile = generatedDir.createSourceFile("NumberStringTypeClass.mts");

  const TTC = new TypeToClass(
    destFile,
    "NumberStringTypeClass",
    notImplementedCallback
  );

  TTC.addType(
    srcFile,
    "NumberStringType",
  );

  await destFile.save();
}

async function buildNumberStringInterfaceClass(
  fixturesDir: ts.Directory,
  generatedDir: ts.Directory
) : Promise<void>
{
  const srcFile = fixturesDir.addSourceFileAtPath("NumberStringInterface.mts");
  const destFile = generatedDir.createSourceFile("NumberStringInterfaceClass.mts");

  const TTC = new TypeToClass(
    destFile,
    "NumberStringInterfaceClass",
    notImplementedCallback
  );

  TTC.addType(
    srcFile,
    "NumberStringInterface",
  );

  await destFile.save();
}

async function buildIsTypedNST(
  fixturesDir: ts.Directory,
  generatedDir: ts.Directory
) : Promise<void>
{
  const srcFile = fixturesDir.addSourceFileAtPath("TypePatterns.mts");
  const destFile = generatedDir.createSourceFile("IsTypedNST.mts");

  const TTC = new TypeToClass(
    destFile,
    "HasTypeString",
    notImplementedCallback
  );

  TTC.addType(
    srcFile,
    "IsTypedNST",
  );

  await destFile.save();
}

async function buildNumberStringWithTypeClass(
  fixturesDir: ts.Directory,
  generatedDir: ts.Directory
) : Promise<void>
{
  let srcFile = fixturesDir.addSourceFileAtPath("NumberStringType.mts");
  const destFile = generatedDir.createSourceFile("NumberStringWithTypeClass.mts");

  const TTC = new TypeToClass(
    destFile,
    "NumberStringTypeClass",
    notImplementedCallback
  );

  TTC.addType(
    srcFile,
    "NumberStringType",
  );

  srcFile = fixturesDir.addSourceFileAtPath("TypePatterns.mts");
  TTC.addType(
    srcFile,
    "IsTypedNST"
  );

  await destFile.save();
}

async function buildPartialType(
  fixturesDir: ts.Directory,
  generatedDir: ts.Directory
) : Promise<void>
{
  const srcFile = fixturesDir.addSourceFileAtPath("NumberStringType.mts");
  const destFile = generatedDir.createSourceFile("NumberStringPartial.mts");

  const TTC = new TypeToClass(
    destFile,
    "PartialType",

    function(
      classNode: ts.ClassDeclaration,
      propertyName: string | symbol,
      propertyNode: FieldDeclaration,
    ) : boolean
    {
      if (propertyName === "repeatBack")
        return false;
      return notImplementedCallback(classNode, propertyName, propertyNode);
    }
  );

  TTC.addType(
    srcFile,
    "NumberStringType",
  );

  await destFile.save();
}

async function buildStringNumberTypeClass(
  fixturesDir: ts.Directory,
  generatedDir: ts.Directory
) : Promise<void>
{
  const srcFile = fixturesDir.addSourceFileAtPath("TypePatterns.mts");
  const destFile = generatedDir.createSourceFile("StringNumberTypeClass.mts");

  const TTC = new TypeToClass(
    destFile,
    "StringNumberTypeClass",
    notImplementedCallback
  );

  TTC.addType(
    srcFile,
    "StringNumberType",
  );

  await destFile.save();
}

async function buildIsTypedNSTWithConstructor(
  fixturesDir: ts.Directory,
  generatedDir: ts.Directory
) : Promise<void>
{
  const srcFile = fixturesDir.addSourceFileAtPath("TypePatterns.mts");
  const destFile = generatedDir.createSourceFile("IsTypedNSTWithConstructor.mts");

  const TTC = new TypeToClass(
    destFile,
    "HasTypeString",
    (
      classNode: ts.ClassDeclaration,
      propertyName: string | symbol,
      propertyNode: FieldDeclaration,
    ) : boolean =>
    {
      if (ts.Node.isMethodDeclaration(propertyNode)) {
        return notImplementedCallback(
          classNode,
          propertyName,
          propertyNode
        );
      }

      const ctors = classNode.getConstructors();
      let targetCtor: ts.ConstructorDeclaration;
      if (!ctors.length) {
        targetCtor = classNode.addConstructor();
      }
      else {
        targetCtor = ctors[0];
      }

      if (propertyName !== "type")
        throw new Error("unexpected property name: " + propertyName.toString());

      const returnType = propertyNode.getTypeNodeOrThrow().getText();
      if (returnType !== "string")
        throw new Error("unexpected property type: " + returnType);

      targetCtor.addStatements(`this.type = "foo";`);
      return true;
    }
  );

  TTC.addType(
    srcFile,
    "IsTypedNST",
  );

  await destFile.save();
}

async function buildNumberStringAndTypeClass(
  fixturesDir: ts.Directory,
  generatedDir: ts.Directory
) : Promise<void>
{
  const srcFile = fixturesDir.addSourceFileAtPath("TypePatterns.mts");
  const destFile = generatedDir.createSourceFile("NumberStringAndTypeClass.mts");

  const TTC = new TypeToClass(
    destFile,
    "NumberStringTypeClass",
    notImplementedCallback
  );

  TTC.addType(
    srcFile,
    "NumberStringAndType",
  );

  await destFile.save();
}

async function throwNumberStringOrBar(
  fixturesDir: ts.Directory,
  generatedDir: ts.Directory
) : Promise<void>
{
  const srcFile = fixturesDir.addSourceFileAtPath("TypePatterns.mts");
  const destFile = generatedDir.createSourceFile("NumberStringOrBarClass.mts");

  const TTC = new TypeToClass(
    destFile,
    "NumberStringTypeClass",
    notImplementedCallback
  );

  let pass = false;
  try {
    TTC.addType(
      srcFile,
      "NumberStringOrBar",
    );
  }
  catch (ex: unknown) {
    if ((ex as Error).message !== "You cannot add a type which is a union of two or more types!  (How should I know which type to support?)")
      throw ex;
    pass = true;
  }

  if (!pass)
    throw new Error("Expected exception for NumberStringOrType, but none was thrown!");

  await destFile.delete();
}
