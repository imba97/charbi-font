import type { FontConfig, ResolvedConfig, StyleFormat } from "../config/schema";
import type { FontGroupMap } from "../types/font-subset";
import fs from "node:fs";
import path from "node:path";
import consola from "consola";
import { FONT_ASSETS_DIR } from "../config/schema";
import { normalizeFamilyForFileName } from "../utils/font-name";

// 生成字体 URL（COS 模式）
function toFontUrl(
  config: ResolvedConfig,
  font: FontConfig,
  version: string,
  extension: string
): string {
  const { cos } = config;
  if (cos.cdnUrl) {
    // 使用 CDN URL，basePath 包含完整路径和版本号占位符
    if (!cos.basePath) {
      throw new Error("COS 配置缺少 basePath，请在 fonts.config.ts 中设置 cos.basePath");
    }
    const filename = `${normalizeFamilyForFileName(font.family)}-${font.weight}.${extension}`;
    const basePath = cos.basePath.replace("{version}", version);

    // 保留协议头（https://），仅规范主机后路径的斜杠
    const cleanCdn = cos.cdnUrl.replace(/\/+$/, "");
    const cleanPath = basePath.replace(/^\/+|\/+$/g, "");
    return `${cleanCdn}/${cleanPath}/${filename}`;
  }
  // 本地路径
  return `./fonts/${normalizeFamilyForFileName(font.family)}-${font.weight}.${extension}`;
}

// 生成单个 @font-face 声明
function generateFontFace(
  family: string,
  weight: number,
  urlOrBase64: string,
  format: string,
  style: "normal" | "italic" = "normal"
): string {
  return `@font-face {
  font-family: '${family}';
  src: url('${urlOrBase64}') format('${format}');
  font-display: swap;
  font-weight: ${weight};
  font-style: ${style};
}`;
}

function normalizeFormat(format: string): string {
  return format.toLowerCase();
}

function toFontExtension(format: string): string {
  const normalized = normalizeFormat(format);
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

function toCssFontFormat(format: string): string {
  const normalized = normalizeFormat(format);
  const cssFormatMap: Record<string, string> = {
    ttf: "truetype",
    truetype: "truetype",
    otf: "opentype",
    opentype: "opentype",
    eot: "embedded-opentype",
    "embedded-opentype": "embedded-opentype",
    woff: "woff",
    woff2: "woff2",
    svg: "svg"
  };
  return cssFormatMap[normalized] || normalized;
}

// 获取文件扩展名
function getStyleExt(styleFormat: StyleFormat): string {
  return styleFormat === "scss" ? "scss" : "css";
}

// 生成 import 语句
function generateImport(fileName: string, styleFormat: StyleFormat): string {
  if (styleFormat === "scss") {
    return `@use './${fileName}' as *;`;
  }
  return `@import './${fileName}';`;
}

// 生成字体样式文件
export async function generateFontCss(
  fontGroupMap: FontGroupMap,
  config: ResolvedConfig,
  version: string,
  subsetExtension: string
): Promise<void> {
  consola.info("生成字体样式文件...");

  const styleFormat = config.output.styleFormat;
  const styleExt = getStyleExt(styleFormat);

  // 配置的目录（如 src/styles）
  const outputDir = path.join(config.root, config.output.cssDir);
  fs.mkdirSync(outputDir, { recursive: true });

  // 字体文件子目录（src/styles/font-assets/）
  const assetsDir = path.join(outputDir, FONT_ASSETS_DIR);
  fs.mkdirSync(assetsDir, { recursive: true });

  const fontFiles: string[] = [];
  let totalCssSize = 0;

  for (const [family, subsets] of fontGroupMap) {
    // 生成 xxx.scss/css 文件（使用 kebab-case，去掉 font- 前缀）
    const styleFileName = `${family.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}.${styleExt}`;
    const styleFilePath = path.join(assetsDir, styleFileName);

    const cssImportPath = config.output.cssDir.replace(/^src\//, "");
    let cssContent = `/**
 * ${family} 字体
 * 由 charbi-font 自动生成
 *
 * 使用方式：
 * ${styleFormat === "scss" ? `@use '@/${cssImportPath}/${FONT_ASSETS_DIR}/${family.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}' as *;` : `import '@/${cssImportPath}/${FONT_ASSETS_DIR}/${family.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}';`}
 *
 * CSS 中使用：
 * font-family: '${family}', sans-serif;
 */

`;

    // 为每个字重生成 @font-face
    for (const subset of subsets) {
      const { config: font, size } = subset;
      const subsetFormat = subset.format || subsetExtension;
      const fontUrl = toFontUrl(config, font, version, toFontExtension(subsetFormat));
      cssContent += generateFontFace(
        family,
        font.weight,
        fontUrl,
        toCssFontFormat(subsetFormat),
        font.style || "normal"
      );
      cssContent += "\n\n";

      const sizeKB = (size / 1024).toFixed(2);
      consola.success(`   ${family} ${font.name} (${font.weight}): ${sizeKB} KB`);
    }

    fs.writeFileSync(styleFilePath, cssContent);
    fontFiles.push(styleFileName);

    const cssSizeKB = (cssContent.length / 1024).toFixed(2);
    totalCssSize += cssContent.length;
    consola.info(`   生成: ${styleFileName} (${cssSizeKB} KB)`);
  }

  // 生成 fonts.scss/css 汇总文件（在配置的目录下，如 src/styles/fonts.scss）
  const cssImportPath = config.output.cssDir.replace(/^src\//, "");
  const indexFileName = `fonts.${styleExt}`;
  const indexCssContent = `/**
 * 字体汇总文件
 * 由 charbi-font 自动生成
 *
 * 此文件包含所有字体的 @font-face 声明
 *
 * 使用方式：
 * ${styleFormat === "scss" ? `@use '@/${cssImportPath}/fonts' as *;` : `import '@/${cssImportPath}/fonts';`}
 */

${fontFiles.map((f) => generateImport(`${FONT_ASSETS_DIR}/${f.replace(/\.(scss|css)$/, "")}`, config.output.styleFormat)).join("\n")}
`;

  const fontsCssPath = path.join(outputDir, indexFileName);
  fs.writeFileSync(fontsCssPath, indexCssContent);

  const totalCssSizeKB = (totalCssSize / 1024).toFixed(2);
  consola.success(`生成汇总文件: ${indexFileName} (${totalCssSizeKB} KB)`);
}
