import fs from "fs/promises";

import ESTreeBase, { TSNode } from "./ESTreeBase.mjs";
import DecideEnumTraversal from "./DecideEnumTraversal.mjs";
import {
  DefaultMap
} from "../../_00_shared_utilities/source/DefaultMap.mjs";

export default
abstract class ESTreeFile extends ESTreeBase
{
  static #fileCache: DefaultMap<string, Promise<string>> = new DefaultMap();
  static async #readFile(pathToFile: string): Promise<string>
  {
    return this.#fileCache.getDefault(
      pathToFile,
      () => fs.readFile(pathToFile, { encoding: "utf-8"})
    );
  }

  #pathToFile: string;
  constructor(
    pathToFile: string,
    decideEnumTraversal: DecideEnumTraversal<TSNode["type"]>
  )
  {
    super("", decideEnumTraversal);
    this.#pathToFile = pathToFile;
  }

  async run(): Promise<void>
  {
    this.setContentsAndFilePath(
      await ESTreeFile.#readFile(this.#pathToFile),
      this.#pathToFile
    );
    await super.run();
  }
}
