import path from "node:path";

/** 与 cacheDir（通常为 …/.cache/fonts）同级的 words 目录 */
export function getWordsCacheDir(cacheDir: string): string {
  return path.join(path.dirname(cacheDir), "words");
}
