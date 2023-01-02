import type { CodeBlockWriter } from "ts-morph";

import { BuilderKind } from "./BuilderKind.mjs";

export interface TypePrinterInterface
{
  readonly builderKind: BuilderKind;

  ready() : boolean;
  print(writer: CodeBlockWriter) : void;
}

export abstract class TypePrinterClass
implements TypePrinterInterface
{
  readonly abstract builderKind: BuilderKind;

  abstract ready() : boolean;
  abstract print(writer: CodeBlockWriter): void;
}
