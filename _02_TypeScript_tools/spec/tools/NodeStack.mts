import TSESTree from "@typescript-eslint/typescript-estree";
type TSNode = TSESTree.TSESTree.Node;

export default class NodeStack {
  readonly stack: TSNode[] = [];
  readonly mismatches: Array<[TSNode | undefined, TSNode | undefined]> = [];
  firstVisited: TSNode | undefined;

  push(n: TSNode) : void
  {
    this.stack.unshift(n);
    if (!this.firstVisited)
      this.firstVisited = n;
  }
  pop(n: TSNode): void
  {
    const top = this.stack.shift();
    if (top !== n)
      this.mismatches.push([top, n]);
  }

  expectEmpty() : void
  {
    expect(this.stack.length).toBe(0);
    expect(this.mismatches.length).toBe(0);
  }
}
