import type { BuildConfig, ResolvedConfig, UserConfig } from "./schema";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createDefu } from "defu";
import { loadConfig as unconfigLoadConfig } from "unconfig";
import { defaultConfig } from "./schema";

const defu = createDefu((obj, key, value) => {
  // 数组不合并，直接覆盖
  if (Array.isArray(obj[key]) && Array.isArray(value)) {
    obj[key] = value;
    return true;
  }
});

const _dirname = path.dirname(fileURLToPath(import.meta.url));

// 获取项目根目录
export function getProjectRoot(): string {
  return process.cwd();
}

// 获取版本号
export function getVersion(userVersion?: string): string {
  if (userVersion) return userVersion;

  const rootPkgPath = path.join(getProjectRoot(), "package.json");
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf-8"));
  return rootPkg.version || "0.0.1";
}

// 获取缓存目录
export function getCacheDir(userCacheDir?: string): string {
  // 如果用户配置了缓存目录，使用用户配置（相对于项目根目录）
  if (userCacheDir) {
    return path.isAbsolute(userCacheDir) ? userCacheDir : path.join(getProjectRoot(), userCacheDir);
  }
  // 默认使用包目录下的 .cache/fonts（node_modules/charbi/.cache/fonts）
  return path.join(_dirname, "../../.cache/fonts");
}

// 加载配置
export async function loadConfig(): Promise<ResolvedConfig> {
  const result = await unconfigLoadConfig<UserConfig>({
    sources: [
      {
        files: "fonts.config",
        extensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "json", "json5"]
      }
    ],
    cwd: getProjectRoot(),
    defaults: {}
  });

  const userConfig = result.config || {};

  // 合并构建配置
  const mergedBuild = defu(userConfig.build || {}, defaultConfig) as BuildConfig;

  // 检查是否配置了字体
  if (!mergedBuild.fonts || mergedBuild.fonts.length === 0) {
    throw new Error("未配置字体，请在 fonts.config.ts 的 build.fonts 中添加字体配置");
  }

  // 构建完整配置
  const resolved: ResolvedConfig = {
    scan: mergedBuild.scan,
    fonts: mergedBuild.fonts,
    output: mergedBuild.output,
    upload: {
      provider: userConfig.upload?.provider || "cos",
      concurrency: userConfig.upload?.concurrency ?? 5
    },
    cos: userConfig.cos || {},
    root: getProjectRoot(),
    cacheDir: getCacheDir(userConfig.cacheDir),
    version: mergedBuild.version
  };

  return resolved;
}
