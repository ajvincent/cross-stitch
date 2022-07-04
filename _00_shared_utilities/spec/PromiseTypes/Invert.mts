import {
  Invert
} from "../../source/PromiseTypes.mjs"

describe("PromiseTypes.Invert", () => {
  it("resolves to a rejected value", async () => {
    const p = Invert(Promise.reject("foo"));
    await expectAsync(p).toBeResolvedTo("foo");
  });

  it("rejects with a resolved promise", async () => {
    await expectAsync(
      Invert(Promise.resolve("foo"))
    ).toBeRejectedWithError("Promise resolved when we didn't expect it to!");
  });
});
