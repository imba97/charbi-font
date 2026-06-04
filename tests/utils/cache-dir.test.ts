import path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { getWordsCacheDir } from "../../src/utils/cache-dir";

describe("cache-dir", () => {
  it("getWordsCacheDir is sibling of fonts cache", () => {
    expect(getWordsCacheDir("/proj/node_modules/@uiron/charbi/.cache/fonts")).toBe(
      "/proj/node_modules/@uiron/charbi/.cache/words"
    );
    expect(getWordsCacheDir(path.join("/proj", ".cache", "fonts"))).toBe(
      path.join("/proj", ".cache", "words")
    );
  });
});
