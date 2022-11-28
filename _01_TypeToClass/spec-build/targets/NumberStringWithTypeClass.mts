import {
  NotImplementedCallbacks,
  FileWithType,
  ManyTypesToClass,
} from "../project-common.mjs";

const TypeFiles: FileWithType[] = [
  {
    pathToTypeFile: "NumberStringType.mts",
    typeName: "NumberStringType"
  },

  {
    pathToTypeFile: "TypePatterns.mts",
    typeName: "IsTypedNST"
  }
];

await ManyTypesToClass(
  "NumberStringWithTypeClass.mts",
  "NumberStringTypeClass",
  TypeFiles,
  NotImplementedCallbacks
);
