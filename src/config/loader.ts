import type { BuildConfig, ResolvedConfig, UserConfig } from "./schema";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pkg from "../../package.json" with { type: "json" };
import { createDefu } from "defu";
import { loadConfig as unconfigLoadConfig } from "unconfig";
import { defaultConfig } from "./schema";
import { parseEnv } from "node:util";

/** 将 npm 包名转为 node_modules 下的路径段，如 @uiron/charbi → ['@uiron','charbi'] */
function npmPackageNameToNodeModulesSegments(name: string): string[] {
  if (!name.startsWith("@")) return [name];
  const i = name.indexOf("/", 1);
  if (i === -1) return [name];
  return [name.slice(0, i), name.slice(i + 1)];
}

const defu = createDefu((obj, key, value) => {
  // 数组不合并，直接覆盖
  if (Array.isArray(obj[key]) && Array.isArray(value)) {
    obj[key] = value;
    return true;
  }
});

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
export function getCacheDir(userCacheDir?: string, projectRoot?: string): string {
  const root = projectRoot ?? getProjectRoot();
  // 如果用户配置了缓存目录，使用用户配置（相对于项目根目录）
  if (userCacheDir) {
    return path.isAbsolute(userCacheDir) ? userCacheDir : path.join(root, userCacheDir);
  }
  // 默认使用 node_modules/<scope>/<pkg>/.cache/fonts（与本包 package.json name 一致）
  const installSegs = npmPackageNameToNodeModulesSegments(pkg.name);
  const nodeModulesPkg = path.join(root, "node_modules", ...installSegs);
  return path.join(nodeModulesPkg, ".cache/fonts");
}

// 加载环境变量文件
export function loadEnvFile(
  mode: "development" | "production",
  userEnv?: BuildConfig["env"],
  projectRoot?: string
): void {
  const root = projectRoot ?? getProjectRoot();
  const defaultEnv = {
    development: ".env.development",
    production: ".env.production"
  };

  const envFile = userEnv?.[mode] || defaultEnv[mode];
  const envPath = path.join(root, envFile);

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const envVars = parseEnv(content);
    for (const [key, value] of Object.entries(envVars)) {
      process.env[key] = value as string;
    }
  }
}

// 加载配置
export async function loadConfig(
  mode: "development" | "production" = "development",
  projectRoot?: string
): Promise<ResolvedConfig> {
  const root = projectRoot ?? getProjectRoot();
  const result = await unconfigLoadConfig<UserConfig>({
    sources: [
      {
        files: "fonts.config",
        extensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "json", "json5"]
      }
    ],
    cwd: root,
    defaults: {}
  });

  const userConfig = result.config || {};

  // 加载环境变量文件
  loadEnvFile(mode, userConfig.build?.env, root);

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
    root,
    cacheDir: getCacheDir(userConfig.build?.cacheDir, root),
    version: mergedBuild.version,
    env: mergedBuild.env || {},
    mode
  };

  return resolved;
}
