import type { CharbiFontFaceDescriptor } from "../client/types";
import type { ResolvedConfig } from "../config/schema";
import { loadConfig } from "../config";
import { subsetOutputFileName } from "../utils/subset-font-file";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/** 与 virtual:charbi 导出字段一一对应 */
export interface CharbiRuntime {
  readonly FONT_BUILD_VERSION: string;
  readonly BUILD_FONT_FACES: readonly CharbiFontFaceDescriptor[];
  readonly FONT_ASSET_BASE_URL: string | undefined;
}

export interface ResolveCharbiRuntimeOptions {
  /** 项目根目录，默认 process.cwd() */
  root?: string;
  /** 与 loadConfig / 虚拟模块一致 */
  mode?: "development" | "production";
}

function resolveProjectPackageVersion(projectRoot: string): string | undefined {
  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return undefined;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (typeof pkg?.version === "string" && pkg.version.length > 0) {
      return pkg.version;
    }
  } catch {
    // ignore and fallback
  }

  return undefined;
}

/** 版本号（与 virtual 模块 FONT_BUILD_VERSION 规则一致） */
export function resolveBuildFontVersion(projectRoot: string = process.cwd()): string {
  return (
    process.env.VITE_FONT_BUILD_VERSION ||
    resolveProjectPackageVersion(projectRoot) ||
    process.env.npm_package_version ||
    "0.0.1"
  );
}

/** 由 ResolvedConfig 推导 BUILD_FONT_FACES */
export function buildFontFaces(config: ResolvedConfig): CharbiFontFaceDescriptor[] {
  return config.fonts.map((font) => ({
    family: font.family,
    file: subsetOutputFileName(font, font.format ?? config.output.format),
    weight: String(font.weight),
    style: font.style ?? "normal",
    variant: "normal" as const
  }));
}

/** CDN 前缀 FONT_ASSET_BASE_URL */
export function resolveFontAssetBaseUrl(
  config: ResolvedConfig,
  version: string
): string | undefined {
  const { cdnUrl, basePath } = config.cos;
  if (!cdnUrl || !basePath) {
    return undefined;
  }
  const cleanCdn = cdnUrl.replace(/\/+$/, "");
  const cleanPath = basePath.replace("{version}", version).replace(/^\/+|\/+$/g, "");
  return `${cleanCdn}/${cleanPath}`;
}

/** 将 runtime 序列化为 virtual:charbi 的 ESM 源码 */
export function serializeCharbiRuntimeAsEsm(runtime: CharbiRuntime): string {
  const lines = [
    `export const FONT_BUILD_VERSION = ${JSON.stringify(runtime.FONT_BUILD_VERSION)};`,
    `export const BUILD_FONT_FACES = ${JSON.stringify(runtime.BUILD_FONT_FACES)};`
  ];
  if (runtime.FONT_ASSET_BASE_URL !== undefined) {
    lines.push(
      `export const FONT_ASSET_BASE_URL = ${JSON.stringify(runtime.FONT_ASSET_BASE_URL)};`
    );
  } else {
    lines.push("export const FONT_ASSET_BASE_URL = undefined;");
  }
  return lines.join("\n");
}

/** Node / uno.config / 脚本：异步解析，等价于 import virtual:charbi 的运行时值 */
export async function resolveCharbiRuntime(
  options: ResolveCharbiRuntimeOptions = {}
): Promise<CharbiRuntime> {
  const root = options.root ?? process.cwd();
  const mode =
    options.mode ?? (process.env.NODE_ENV === "production" ? "production" : "development");
  const config = await loadConfig(mode, root);
  const version = resolveBuildFontVersion(root);
  const assetBase = resolveFontAssetBaseUrl(config, version);
  const faces = buildFontFaces(config);

  return {
    FONT_BUILD_VERSION: version,
    BUILD_FONT_FACES: faces,
    FONT_ASSET_BASE_URL: assetBase
  };
}
