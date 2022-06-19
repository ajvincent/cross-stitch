import type { NumberStringFoo } from "./NumberFooType.mjs";

export default class Foo implements NumberStringFoo
{
  repeatBack(n: number, s: string): string
  {
    return s.repeat(n);
  }

  repeatForward(s: string, n: number): string
  {
    return s.repeat(n);
  }

  repeatFoo(n: number): string {
    return this.repeatForward("foo", n);
  }
}
