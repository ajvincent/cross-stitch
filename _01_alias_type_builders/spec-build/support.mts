import { CodeBlockWriter } from "ts-morph";
import {
  createSourceFile
} from "../../_00_shared_utilities/spec-utilities/BasicTypesSource.mjs";

import * as AliasTypeBuilders from "../exports.mjs";

const typePrinterList: AliasTypeBuilders.TypePrinterInterface[] = [
  new AliasTypeBuilders.StringWrapper("oneStringType", false),
  new AliasTypeBuilders.StringWrapper("enclosedString", true),

  new AliasTypeBuilders.Root()
    .addLiteral("oneNumberType"),
  new AliasTypeBuilders.Root()
    .addNumeric(17),
  new AliasTypeBuilders.Root()
    .addString("some string type"),
  new AliasTypeBuilders.Root()
    .addTypePrinter(
      new AliasTypeBuilders.StringWrapper("anyStringType", false),
    ),

  new AliasTypeBuilders.Intersection()
    .addString("foo")
    .addString("bar"),

  new AliasTypeBuilders.Union()
    .addString("foo")
    .addString("bar"),

  new AliasTypeBuilders.KeyofTypeofOperator(true, false)
    .addLiteral("NumberStringType"),

  new AliasTypeBuilders.TypeArgumented(
    new AliasTypeBuilders.StringWrapper("GetterAndSetter", false)
  )
    .addLiteral("number")
    .addLiteral("string"),

  new AliasTypeBuilders.IndexedAccess(
    new AliasTypeBuilders.StringWrapper("objectIntersectionType", false)
  )
    .addString("fooObject"),
];

const addTypeAliasTest = new AliasTypeBuilders.StringWrapper("addTypeAliasTest", true);

export default async function runModule() : Promise<void>
{
  const generated = createSourceFile(
    "_01_alias_type_builders/spec-generated/aliases.mts",
    (writer: CodeBlockWriter) : void => {
      typePrinterList.map((typePrinter, index) => {
        writer.write(`export type ALIAS_TYPE_${index.toString().padStart(2, "0")} = `);
        typePrinter.print(writer);
        writer.write(";")
        writer.newLine();
      });
    }
  );

  generated.addTypeAlias({
    name: "addTypeAliasTest",
    type: (writer) => addTypeAliasTest.print(writer),
    isExported: true,
  });

  generated.fixMissingImports();
  generated.formatText({
    ensureNewLineAtEndOfFile: true,
    indentSize: 2,
  });
  await generated.save();
}
