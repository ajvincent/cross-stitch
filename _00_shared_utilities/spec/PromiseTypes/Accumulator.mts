import {
  Deferred,
  Accumulator
} from "../../source/PromiseTypes.mjs";

import {
  setImmediate as setImmediatePromise
} from "timers/promises";

describe("PromiseTypes.Accumulator", () => {
  let acc: Accumulator<true>;
  beforeEach(() => acc = new Accumulator);

  it("resolves for a single task", async () => {
    await expectAsync(
      acc.track(Promise.resolve(true))
    ).toBeResolvedTo(true);

    await expectAsync(acc.finalPromise).toBeResolvedTo([true]);
  });

  it("rejects for a rejected promise", async () => {
    const exn = new Error("sorry");
    await expectAsync(
      acc.track(Promise.reject(exn))
    ).toBeRejectedWithError("sorry");

    await expectAsync(acc.finalPromise).toBeRejectedWithError(
      "Accumulator failed on an added task"
    );

    const aggError = await acc.finalPromise.then(
      () : never => { throw new Error("unreached") },
      (exn: AggregateError) => exn
    );
    expect(aggError).toBeInstanceOf(AggregateError);
    expect(aggError.errors.length).toBe(1);
    expect(aggError.errors[0]).toBe(exn);
  });

  it("allows adding more tasks while a following task is pending", async () => {
    const deferred0: Deferred<true> = new Deferred;
    void(acc.track(deferred0.promise));

    const deferred1: Deferred<true> = new Deferred;
    void(acc.track(deferred1.promise));

    await expectAsync(Promise.race([
      acc.finalPromise,
      setImmediatePromise(false),
    ])).toBeResolvedTo(false);

    deferred0.resolve(true);

    await expectAsync(Promise.race([
      acc.finalPromise,
      setImmediatePromise(false),
    ])).toBeResolvedTo(false);

    deferred1.resolve(true);

    await expectAsync(acc.finalPromise).toBeResolvedTo([true, true]);
  });

  it("allows adding more tasks while a preceding task is pending", async () => {
    const deferred0: Deferred<true> = new Deferred;
    void(acc.track(deferred0.promise));

    const deferred1: Deferred<true> = new Deferred;
    void(acc.track(deferred1.promise));

    await expectAsync(Promise.race([
      acc.finalPromise,
      setImmediatePromise(false),
    ])).toBeResolvedTo(false);

    deferred1.resolve(true);

    await expectAsync(Promise.race([
      acc.finalPromise,
      setImmediatePromise(false),
    ])).toBeResolvedTo(false);

    deferred0.resolve(true);

    await expectAsync(acc.finalPromise).toBeResolvedTo([true, true]);
  });

  it("rejects adding more tasks after all pending have settled", async () => {
    await acc.track(Promise.resolve(true));

    await expectAsync(
      acc.track(Promise.resolve(true))
    ).toBeRejectedWithError("You can't add a task after all pending tasks have settled!");
  });
});
