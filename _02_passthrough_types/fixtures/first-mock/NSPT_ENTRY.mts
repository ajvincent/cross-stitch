import {
  INVOKE_SYMBOL,
  PropertyKey
} from "../../source/exports/Common.mjs";

import type {
  ComponentPassThroughMap,
} from "../../source/exports/PassThroughSupport.mjs";

import Entry_Base from "../../source/exports/Entry_Base.mjs";

import type {
  NumberStringType
} from "../NumberStringType.mjs";

export default class NumberString_EntryBase
               extends Entry_Base
               implements NumberStringType
{
  #initialTarget: PropertyKey;
  #passThroughMap: ComponentPassThroughMap<NumberStringType>;

  constructor(
    initialTarget: PropertyKey,
    passThroughMap: ComponentPassThroughMap<NumberStringType>
  )
  {
    super();
    this.#initialTarget = initialTarget;
    this.#passThroughMap = passThroughMap;
  }

  repeatForward(s: string, n: number): string
  {
    return this[INVOKE_SYMBOL]<
      NumberStringType["repeatForward"],
      NumberStringType
    >
    (
      this.#initialTarget,
      this.#passThroughMap,
      "repeatForward",
      [s, n]
    );
  }

  repeatBack(n: number, s: string): string
  {
    return this[INVOKE_SYMBOL]<
      NumberStringType["repeatBack"],
      NumberStringType
    >
    (
      this.#initialTarget,
      this.#passThroughMap,
      "repeatBack",
      [n, s]
    );
  }
}
