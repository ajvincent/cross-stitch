import {
  NotImplementedCallbacks,
  OneTypeToClass,
} from "../project-common.mjs";

await OneTypeToClass(
  "NumberStringInterface.mts",
  "NumberStringInterface",
  "NumberStringInterfaceClass.mts",
  "NumberStringInterfaceClass",
  NotImplementedCallbacks
);
