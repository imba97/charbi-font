import type { ExtraText, FontConfig } from "../config/schema";
import type { FontGroupMap, FontSubsetInfo } from "../types/font-subset";
import fs from "node:fs";
import path from "node:path";
import consola from "consola";
import FontMin from "fontmin";
import { normalizeFamilyForFileName } from "../utils/font-name";

function normalizeExtraText(extraText?: ExtraText): string[] {
  if (!extraText) {
    return [];
  }

  return Array.isArray(extraText) ? extraText : [extraText];
}

function mergeChars(baseChars: Set<string>, extraText?: ExtraText): string {
  const mergedChars = new Set(baseChars);

  for (const text of normalizeExtraText(extraText)) {
    for (const char of text) {
      if (char.trim()) {
        mergedChars.add(char);
      }
    }
  }

  return Array.from(mergedChars).join("");
}

// 生成字体子集
export async function generateFontSubset(
  fontPathMap: Map<string, string>,
  outputDir: string,
  chars: Set<string>,
  fonts: FontConfig[],
  format: "woff" | "woff2" | "ttf" = "woff"
): Promise<Map<string, FontSubsetInfo[]>> {
  consola.info("生成字体子集...");

  const fontGroupMap: FontGroupMap = new Map();

  for (const font of fonts) {
    const fontPath = fontPathMap.get(`${font.family}-${font.weight}`);
    if (!fontPath) {
      consola.warn(`   跳过 ${font.family} ${font.name} (未下载)`);
      continue;
    }

    consola.info(`   处理 ${font.family} ${font.name}...`);

    // 使用字体单独配置的格式，如果没有则使用全局格式
    const fontFormat = font.format || format;
    const charText = mergeChars(chars, font.extraText);

    try {
      const result = await new Promise<{ outputPath: string; size: number }>((resolve, reject) => {
        const fontmin = FontMin()
          .src(fontPath)
          .use(
            FontMin.glyph({
              text: charText,
              hinting: false
            })
          );

        // 根据格式选择插件
        if (fontFormat === "woff2") {
          fontmin.use(FontMin.ttf2woff2());
        } else if (fontFormat === "woff") {
          fontmin.use(FontMin.ttf2woff());
        }
        // ttf 格式不需要额外插件

        fontmin.dest(outputDir).run((err, files) => {
          if (err) {
            reject(err);
          } else if (files && files[0]) {
            const output = files[0];
            const ext = fontFormat === "woff2" ? "woff2" : fontFormat;
            const normalizedFamily = normalizeFamilyForFileName(font.family);
            const newName = `${normalizedFamily}-${font.weight}.${ext}`;
            const newPath = path.join(outputDir, newName);
            if (output.path && fs.existsSync(output.path)) {
              fs.renameSync(output.path, newPath);
            }

            const stats = fs.statSync(newPath);
            resolve({ outputPath: newPath, size: stats.size });
          } else {
            reject(new Error("No output file generated"));
          }
        });
      });

      const sizeKB = (result.size / 1024).toFixed(2);
      consola.success(`     完成 ${font.family} ${font.name} (${sizeKB} KB)`);

      // 按 family 分组
      if (!fontGroupMap.has(font.family)) {
        fontGroupMap.set(font.family, []);
      }
      fontGroupMap.get(font.family)!.push({
        config: font,
        filePath: result.outputPath,
        size: result.size,
        format: fontFormat
      });
    } catch (error: any) {
      consola.error(`     失败 ${font.family} ${font.name}: ${error.message}`);
    }
  }

  return fontGroupMap;
}
