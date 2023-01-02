import { CodeBlockWriter } from "ts-morph";

import { Root } from "../source/exports.mjs";

const WriterOptions = Object.freeze({
  indentNumberOfSpaces: 2,
});

it("Root asserts it is ready to print before printing a value", () => {
  const printer = new Root, writer = new CodeBlockWriter(WriterOptions);
  expect(
    () => printer.print(writer)
  ).toThrowError("This type builder is not ready!");
});
