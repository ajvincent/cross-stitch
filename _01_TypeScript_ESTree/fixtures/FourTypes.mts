export type Alpha = "alpha";
export type BetaGamma = "beta" | "gamma";
type Delta = "delta";

const d: Delta = "delta";
void(d);

type NumberStringType = {
  repeatForward(s: string, n: number): string;
  repeatBack(n: number, s: string): string;
};

const x: NumberStringType = {
  repeatBack(n, s) {
    void(s);
    void(n);
    throw new Error("not implemented");
  },

  repeatForward(s, n) {
    void(s);
    void(n);
    throw new Error("still not implemented");
  },
}
void(x);

export class NST implements NumberStringType
{
  repeatBack(n: number, s: string): string
  {
    return s.repeat(n);
  }

  repeatForward(s: string, n: number): string
  {
    return this.repeatBack(n, s);
  }
}
