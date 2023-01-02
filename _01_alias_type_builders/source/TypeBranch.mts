import type { CodeBlockWriter } from "ts-morph";

import {
  type TypePrinterInterface,
  TypePrinterClass,
} from "./TypePrinter.mjs";

import StringWrapper from "./StringWrapper.mjs";
import { BuilderKind } from "./BuilderKind.mjs";
export interface ReadonlyTypeBranch
extends TypePrinterInterface
{
  readonly minTypeArgumentCount : number;
  readonly maxTypeArgumentCount : number | undefined;

  readonly typeArguments: ReadonlyArray<TypePrinterClass>;
}

export interface TypeBranchInterface
extends ReadonlyTypeBranch
{
  /**
   * Add a literal without string escaping, wrapped in a StringWrapper.
   * @param arg - the literal to add.
   */
  addLiteral(arg: string) : this;

  /**
   * Add a number, wrapped in a StringWrapper.
   * @param arg - the number to add.
   */
  addNumeric(arg: number) : this;

  /**
   * Add a string, wrapped in a StringWrapper for string escaping.
   * @param arg - the string to add.
   */
  addString(arg: string) : this;

  /**
   * Add a type printer as a child of this.
   * @param printer - the type printer
   */
  addTypePrinter(printer: TypePrinterClass) : this;
}

export abstract class TypeBranchClass
extends TypePrinterClass
implements TypeBranchInterface
{
  readonly #typeArguments: TypePrinterClass[] = [];
  readonly typeArguments: ReadonlyArray<TypePrinterClass> = this.#typeArguments;

  abstract readonly minTypeArgumentCount : number;
  abstract readonly maxTypeArgumentCount : number | undefined;
  #assertMayAdd() : void
  {
    if (this.#typeArguments.length === this.maxTypeArgumentCount)
      throw new Error("Maximum type argument count reached!");
  }

  addLiteral(arg: string): this
  {
    return this.#addStringWrapper(arg, false);
  }

  addNumeric(arg: number): this
  {
    return this.#addStringWrapper(arg.toString(), false);
  }

  addString(arg: string): this
  {
    return this.#addStringWrapper(arg, true);
  }

  /**
   * Add a string wrapper as a child of this.
   * @param arg - The string to wrap.
   * @param asQuoted - True if we want to treat this as a quoted string.
   */
  #addStringWrapper(arg: string, asQuoted: boolean) : this
  {
    this.#assertMayAdd()

    const wrapper = new StringWrapper(arg, asQuoted);
    wrapper.markAttached();
    this.#typeArguments.push(wrapper);

    this.#maybeMarkReady();
    return this;
  }

  addTypePrinter(printer: TypePrinterClass) : this
  {
    this.#assertMayAdd();

    if (printer.builderKind === BuilderKind.Root)
      throw new Error("Root builders may never be children of other builders");
    if (printer.isAttached)
      throw new Error("builder is already attached");
    if (!printer.isReady)
      throw new Error("builder is not ready to be attached");

    printer.markAttached();
    this.#typeArguments.push(printer);

    this.#maybeMarkReady();
    return this;
  }

  get isReady() : boolean
  {
    return this.#maybeMarkReady();
  }

  static readonly #markedReady = new WeakSet<TypePrinterInterface>;
  #maybeMarkReady() : boolean
  {
    if (TypeBranchClass.#markedReady.has(this))
      return true;

    const rv = (
      (this.#typeArguments.length >= this.minTypeArgumentCount) &&
      this.#typeArguments.every(typeArg => typeArg.isReady)
    );

    if (rv) {
      TypeBranchClass.#markedReady.add(this);
    }

    return rv;
  }

  abstract print(writer: CodeBlockWriter): void;

  /**
   * Write the child type arguments.
   *
   * @param writer - the code block writer.
   * @param joinChars - characters to insert between each child type argument.
   */
  protected forEachChildPrint(
    writer: CodeBlockWriter,
    joinChars = "",
  ) : void
  {
    this.#typeArguments.forEach(
      (arg, index) => this.#writeChild(writer, arg, index, joinChars)
    );
  }

  /**
   * Write a child type argument.
   *
   * @param writer - the code block writer.
   * @param child - the child to write.
   * @param index - the index of the child among `this.#typeArguments`.
   * @param joinChars - characters to insert between each child type argument.
   */
  #writeChild(
    writer: CodeBlockWriter,
    child: TypePrinterClass,
    index: number,
    joinChars: string,
  ) : void
  {
    if (index)
      writer.write(joinChars);

    if (child.builderKind !== BuilderKind.StringWrapper)
    {
      writer.newLine();
      writer.indent(() => child.print(writer));
      writer.newLine();
    }
    else
      child.print(writer);
  }
}
