import type { CodeBlockWriter } from "ts-morph";

import { BuilderKind } from "./BuilderKind.mjs";

export interface TypePrinterInterface
{
  /** An unique builder kind for each class. */
  readonly printerKind: BuilderKind;

  /** True if this is ready to print. */
  readonly isReady: boolean;

  /** True if this is attached to a type builder tree. */
  readonly isAttached: boolean;

  /**
   * Print this type!
   * @param writer - The code block writer to feed.
   */
  print(writer: CodeBlockWriter) : void;
}

export abstract class TypePrinterClass
implements TypePrinterInterface
{
  readonly abstract printerKind: BuilderKind;

  abstract readonly isReady : boolean;

  #isAttached = false;
  get isAttached() : boolean {
    return this.#isAttached;
  }

  /** Mark this builder as attached to a type builder tree. */
  markAttached() : void
  {
    this.assertReadyToPrint();
    this.#isAttached = true;
  }

  /** Assert the .isReady property is true. */
  protected assertReadyToPrint() : void
  {
    if (!this.isReady)
      throw new Error("This type builder is not ready!");
  }

  abstract print(writer: CodeBlockWriter): void;
}
