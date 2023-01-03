import { CodeBlockWriter } from "ts-morph";
import type {
  TypePrinterInterface
} from "../../../_01_alias_type_builders/exports.mjs";

export default function ErrorWithCodeBlockWriter(
  message: string,
  ref: TypePrinterInterface
) : never
{
  const WriterOptions = Object.freeze({
    indentNumberOfSpaces: 2,
  });
  const writer = new CodeBlockWriter(WriterOptions);
  ref.print(writer);

  throw new Error(`${message}: ${writer.toString()}`);
}
