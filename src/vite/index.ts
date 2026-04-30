import type { ResolvedConfig } from "../config/schema";
import { loadConfig } from "../config";
import { subsetOutputFileName } from "../utils/subset-font-file";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export interface VitePluginLike {
  name: string;
  resolveId?: (id: string) => string | null;
  load?: (id: string) => string | null | Promise<string | null>;
  configResolved?: (config: { root: string }) => void;
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

/** 与虚拟模块 `FONT_BUILD_VERSION` 一致：优先环境变量，其次项目 package.json */
function resolveBuildFontVersion(projectRoot: string = process.cwd()): string {
  return (
    process.env.VITE_FONT_BUILD_VERSION ||
    resolveProjectPackageVersion(projectRoot) ||
    process.env.npm_package_version ||
    "0.0.1"
  );
}

function resolveFontAssetBaseUrl(config: ResolvedConfig, version: string): string | undefined {
  const { cdnUrl, basePath } = config.cos;
  if (!cdnUrl || !basePath) {
    return undefined;
  }
  const cleanCdn = cdnUrl.replace(/\/+$/, "");
  const cleanPath = basePath.replace("{version}", version).replace(/^\/+|\/+$/g, "");
  return `${cleanCdn}/${cleanPath}`;
}

export default function CharbiFont(): VitePluginLike {
  let viteRoot = process.cwd();

  return {
    name: "virtual-charbi-font",
    configResolved(config) {
      viteRoot = config.root;
    },
    resolveId(id: string) {
      if (id === "virtual:charbi-font") return "\0virtual:charbi-font";
      return null;
    },
    async load(id: string) {
      if (id !== "\0virtual:charbi-font") return null;

      const mode = process.env.NODE_ENV === "production" ? "production" : "development";
      const config = await loadConfig(mode, viteRoot);
      const version = resolveBuildFontVersion(viteRoot);
      const assetBase = resolveFontAssetBaseUrl(config, version);

      const faces = config.fonts.map((font) => ({
        family: font.family,
        file: subsetOutputFileName(font, font.format ?? config.output.format),
        weight: String(font.weight),
        style: font.style ?? "normal",
        variant: "normal" as const
      }));

      const lines = [
        `export const FONT_BUILD_VERSION = ${JSON.stringify(version)};`,
        `export const BUILD_FONT_FACES = ${JSON.stringify(faces)};`
      ];
      if (assetBase !== undefined) {
        lines.push(`export const FONT_ASSET_BASE_URL = ${JSON.stringify(assetBase)};`);
      } else {
        lines.push("export const FONT_ASSET_BASE_URL = undefined;");
      }

      return lines.join("\n");
    }
  };
}
