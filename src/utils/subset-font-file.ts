import type { FontConfig } from "../config/schema";
import path from "node:path";
import { normalizeFamilyForFileName } from "./font-name";

/** 与 CSS / 上传产物一致的扩展名（小写） */
export function resolveFontFileExtension(format: string): string {
  const normalized = format.toLowerCase();
  const extensionMap: Record<string, string> = {
    truetype: "ttf",
    ttf: "ttf",
    opentype: "otf",
    otf: "otf",
    "embedded-opentype": "eot",
    eot: "eot",
    woff: "woff",
    woff2: "woff2",
    svg: "svg"
  };
  return extensionMap[normalized] || normalized;
}

/** 子集/words 共用的文件主名（family 去空格 + weight） */
export function subsetOutputBaseName(font: FontConfig): string {
  return `${normalizeFamilyForFileName(font.family)}-${font.weight}`;
}

/** 子集化上传后的文件名（与 generate-css CDN URL 一致） */
export function subsetOutputFileName(font: FontConfig, formatForFile: string): string {
  const ext = resolveFontFileExtension(formatForFile);
  return `${subsetOutputBaseName(font)}.${ext}`;
}

/** 与 subsets 文件名一一对应的字符清单（仅扩展名为 .txt） */
export function subsetWordsFileName(font: FontConfig): string {
  return `${subsetOutputBaseName(font)}.txt`;
}

/** 根据 fonts 配置列出应上传的子集文件路径（仅配置项，不扫描目录其余文件） */
export function resolveConfiguredSubsetPaths(
  fonts: FontConfig[],
  defaultFormat: string,
  subsetCacheDir: string
): string[] {
  return fonts.map((font) =>
    path.join(subsetCacheDir, subsetOutputFileName(font, font.format ?? defaultFormat))
  );
}
