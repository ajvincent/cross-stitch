import { CodeBlockWriter } from "ts-morph";

import { StringWrapper } from "../source/exports.mjs";

const WriterOptions = Object.freeze({
  indentNumberOfSpaces: 2,
});

describe("StringWrapper", () => {
  let writer: CodeBlockWriter;

  beforeEach(() => {
    writer = new CodeBlockWriter(WriterOptions);
  });

  it("can write ordinary literals", () => {
    const foo = new StringWrapper(`foo`, false);
    foo.print(writer);
    expect(writer.toString()).toBe(`foo`);
  });

  it("can write ordinary strings", () => {
    const foo = new StringWrapper(`foo`, true);
    foo.print(writer);
    expect(writer.toString()).toBe(`"foo"`);
  });

  it("can write strings with quotes", () => {
    const foo = new StringWrapper(`"foo"`, true);
    foo.print(writer);
    expect(writer.toString()).toBe(`"\\"foo\\""`);
  });
});
