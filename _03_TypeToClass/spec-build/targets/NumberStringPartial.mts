import {
  NotImplementedCallbacks,
  TypeToClassCallbacks,
  OneTypeToClass,
} from "../project-common.mjs";

const callbacks: TypeToClassCallbacks = {
  maybeAddMethod(classDeclaration, structure) {
    if (structure.name === "repeatBack")
      return Promise.resolve(null);
    return NotImplementedCallbacks.maybeAddMethod(classDeclaration, structure);
  },
  maybeAddProperty(classDeclaration, structures) {
    return NotImplementedCallbacks.maybeAddProperty(classDeclaration, structures);
  },
};

await OneTypeToClass(
  "NumberStringType.mts",
  "NumberStringType",
  "NumberStringPartial.mts",
  "PartialType",
  callbacks
);
