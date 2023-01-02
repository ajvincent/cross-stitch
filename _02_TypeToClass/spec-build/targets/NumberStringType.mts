import {
  NotImplementedCallbacks,
  OneTypeToClass,
} from "../project-common.mjs";

await OneTypeToClass(
  "NumberStringType.mts",
  "NumberStringType",
  "NumberStringTypeClass.mts",
  "NumberStringTypeClass",
  NotImplementedCallbacks
);
