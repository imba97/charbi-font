import type { FontConfig } from "../config/schema";
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

/** 子集化上传后的文件名（与 generate-css CDN URL 一致） */
export function subsetOutputFileName(font: FontConfig, formatForFile: string): string {
  const ext = resolveFontFileExtension(formatForFile);
  return `${normalizeFamilyForFileName(font.family)}-${font.weight}.${ext}`;
}
