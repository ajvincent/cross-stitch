import fs from "fs/promises";
import path from "path";

import ts from "ts-morph";

import {
  StaticValidator,
  BuildData,
  ComponentLocationData,
  SequenceKeysData,
} from "./ProjectJSON.mjs";
import ComponentClassGenerator from "./ComponentClassGenerator.mjs";

export default async function ProjectDriver(
  pathToProjectJSON: string
) : Promise<ts.Project>
{
  const baseDir = path.dirname(pathToProjectJSON);
  function relPath(...parts: string[]) : string
  {
    return path.resolve(baseDir, ...parts);
  }

  let config: BuildData;
  {
    const contents = JSON.parse(await fs.readFile(pathToProjectJSON, { encoding: "utf-8"}));
    if (!StaticValidator(contents))
      throw new Error("static validation failed");
    config = contents;
  }

  const project: ts.Project = new ts.Project({
    compilerOptions: {
      lib: ["es2022"],
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

  if (config.sourceDirectories) {
    config.sourceDirectories.forEach(
      dir => project.addDirectoryAtPath(relPath(dir))
    );
  }

  const generatorData = config.componentGenerator;

  const targetDir = relPath(generatorData.targetDirLocation);
  await fs.mkdir(targetDir, { recursive: true });

  const generator = new ComponentClassGenerator(
    project.addSourceFileAtPath(relPath(generatorData.sourceTypeLocation)),
    generatorData.sourceTypeAlias,
    project.addDirectoryAtPath(targetDir),
    generatorData.baseClassName,
    generatorData.entryTypeAlias
  );

  await generator.run();

  // Build the component map's keys.
  const entries: [string, SequenceKeysData | ComponentLocationData][] = Object.entries(config.keys).map(
    ([key, componentOrSequence]) => {
      if (componentOrSequence.type === "sequence") {
        return [key, componentOrSequence];
      }

      let componentPath = relPath(componentOrSequence.file);
      componentPath = path.relative(targetDir, componentPath);
      if (!componentPath.startsWith("."))
        componentPath = "./" + componentPath;

      const component: ComponentLocationData = {
        type: "component",
        file: componentPath
      };
      return [key, component];
    }
  );
  await generator.addKeys(Object.fromEntries(entries));

  if (config.startComponent)
    await generator.setStartComponent(config.startComponent);

  return project;
}
