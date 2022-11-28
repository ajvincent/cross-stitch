import ts from "ts-morph";

import {
  TypeToClassCallbacks,
  NotImplementedCallbacks,
  OneTypeToClass,
} from "../project-common.mjs";

const callbacks: TypeToClassCallbacks = {
  maybeAddMethod(classDeclaration, structure) {
    return NotImplementedCallbacks.maybeAddMethod(classDeclaration, structure);
  },

  maybeAddProperty(classDeclaration, structures) {
    if (structures.property.name !== "type")
      throw new Error(`unexpected property name: ${structures.property.name}`);

    debugger;
    const ctor: Omit<ts.ConstructorDeclarationStructure, "kind"> = {
      statements: [
        `this.type = "foo";`
      ]
    };
    classDeclaration.addConstructor(ctor);

    return Promise.resolve({ property: structures.property });
  },
};

await OneTypeToClass(
  "TypePatterns.mts",
  "IsTypedNST",
  "IsTypedNSTWithConstructor.mts",
  "HasTypeString",
  callbacks
);
