import path from "node:path";

/** cacheDir（…/.cache/fonts）所在的 .cache 根目录 */
function getCacheRoot(cacheDir: string): string {
  return path.dirname(cacheDir);
}

/** 子集字体输出目录（与 fonts 缓存同级，位于 .cache/subsets） */
export function getSubsetCacheDir(cacheDir: string): string {
  return path.join(getCacheRoot(cacheDir), "subsets");
}

/** 字符清单目录（与 fonts 缓存同级，位于 .cache/words） */
export function getWordsCacheDir(cacheDir: string): string {
  return path.join(getCacheRoot(cacheDir), "words");
}
