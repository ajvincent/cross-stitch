import {
  TypeToClassCallbacks,
  OneTypeToClass,
} from "../project-common.mjs";

const callbacks: TypeToClassCallbacks = {
  async maybeAddMethod(classDeclaration, structure) {
    void(classDeclaration);
    structure.statements = `return s.repeat(n);\n`;
    return structure;
  },

  async maybeAddProperty(classDeclaration, structures) {
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
