import ts from "ts-morph";

import path from "path";
import url from "url";

const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");

import TypeToClass from "../source/TypeToClass.mjs";

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

  project.addSourceFileAtPath(path.join(parentDir, "fixtures/NumberStringType.mts"));

  const fixturesDir = project.getDirectoryOrThrow(path.join(parentDir, "fixtures"));
  const generatedDir = project.addDirectoryAtPath(path.join(parentDir, "spec-generated"));

  await buildNumberStringClass(fixturesDir, generatedDir);
}

async function buildNumberStringClass(
  fixturesDir: ts.Directory,
  generatedDir: ts.Directory
) : Promise<void>
{
  const destFile = generatedDir.createSourceFile("NumberStringTypeClass.mts");
  const srcFile = fixturesDir.getSourceFileOrThrow("NumberStringType.mts");

  const notImplemented = `throw new Error("not yet implemented");`;

  const TTC = new TypeToClass(
    destFile,
    "NumberStringTypeClass",
    (
      classNode, propertyName, propertyNode
    ) : boolean =>
    {
      if (ts.Node.isMethodDeclaration(propertyNode)) {
        propertyNode.addStatements(notImplemented)
      }
      else {
        propertyNode.remove();
        if (typeof propertyName === "symbol")
          throw new Error("unexpected symbol property name");
        classNode.addGetAccessor({
          name: propertyName,
          statements: notImplemented
        });
        classNode.addSetAccessor({
          name: propertyName,
          statements: notImplemented
        });
      }

      return true;
    }
  );

  TTC.addType(
    srcFile,
    "NumberStringType",
  );

  await destFile.save();
}

// #region garbage
class InterfaceMap extends Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration | null>
{
  #sourceFile: ts.SourceFile;
  constructor(sourceFile: ts.SourceFile)
  {
    super();
    this.#sourceFile = sourceFile;
  }

  #getNode(name: string) : ts.InterfaceDeclaration | ts.TypeAliasDeclaration
  {
    const interfaceDecl = this.#sourceFile.getInterface(name);
    if (interfaceDecl)
      return interfaceDecl;
  
    return this.#sourceFile.getTypeAliasOrThrow(name);
  }

  getInterface(name: string) : ts.InterfaceDeclaration | ts.TypeAliasDeclaration
  {
    if (!this.has(name)) {
      this.set(name, this.#getNode(name));
    }

    return this.get(name) as ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
  }
}

class TypeMap extends Map<string, ts.Type>
{
  #interfaceMap: InterfaceMap;
  constructor(interfaceMap: InterfaceMap) {
    super();
    this.#interfaceMap = interfaceMap;
  }

  getType(name: string): ts.Type {
    return this.#interfaceMap.getInterface(name).getType();
  }
}

async function foo() : Promise<void>
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

  const useCase = project.addSourceFileAtPath(path.join(parentDir, "useCase.mts"));
  //console.log(useCase.getStructure());

  const interfaceMap = new InterfaceMap(useCase);
  const typeMap = new TypeMap(interfaceMap)

  const Nodes = {
    ExtendedNumberStringType: interfaceMap.getInterface("ExtendedNumberStringType"),
    ExtendedObjectType: interfaceMap.getInterface("ExtendedObjectType"),
    NumberStringType: interfaceMap.getInterface("NumberStringType"),
  };
  void(Nodes);

  const Types = {
    ExtendedNumberStringType: typeMap.getType("ExtendedNumberStringType"),
    ExtendedObjectType: typeMap.getType("ExtendedObjectType"),
    NumberStringType: typeMap.getType("NumberStringType"),
  }
  void(Types);

  // eslint-disable-next-line no-debugger
  debugger;

  const markup = Types.ExtendedNumberStringType.getText(
    Nodes.ExtendedNumberStringType
  );
  console.log(markup);

  // eslint-disable-next-line no-debugger
  debugger;

  /*
  const repeatForwardExtended = Types.ExtendedNumberStringType.getPropertyOrThrow("repeatForward")
                                     .getTypeAtLocation(Nodes.ExtendedNumberStringType);
  console.log(repeatForwardExtended.getText());

  const repeatForwardSignatures = repeatForwardExtended.getCallSignatures();
  */

  //console.log(sourceType);

  const targetFile = project.createSourceFile(path.join(parentDir, "spec-generated/junk.mts"), `
import type { ExtendedNumberStringType } from "../useCase.mjs";
  `.trim() + "\n");
  await targetFile.save();
}

void(foo);
// #endregion garbage
