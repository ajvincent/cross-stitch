import {
  TypeToClassCallbacks,
  OneTypeToClass,
} from "../project-common.mjs";

const callbacks: TypeToClassCallbacks = {
  async maybeAddMethod(classDeclaration, structure)
  {
    void(classDeclaration);
    structure.statements = [];
    if (structure.parameters)
    {
      structure.statements.push(...structure.parameters.map(p => `void(${p.name});\n`));
    }
    structure.statements.push(`throw new Error("not yet implemented");`);
    return structure;
  },

  async maybeAddProperty(classDeclaration, structures)
  {
    void(classDeclaration);
    void(structures);
    throw new Error("unexpected");
  },
};

await OneTypeToClass(
  "NumberStringType.mts",
  "NumberStringType",
  "NumberStringTypeClass.mts",
  "NumberStringTypeClass",
  callbacks
);
