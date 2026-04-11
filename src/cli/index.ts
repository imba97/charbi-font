import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import consola from "consola";
import { getVersion, loadConfig } from "../config/loader";
import { downloadFonts } from "../core/download";
import { generateFontCss } from "../core/generate-css";
import { collectChars } from "../core/scan";
import { generateFontSubset } from "../core/subset";
import { uploadToCDN } from "../uploader";

// 主函数
async function main(): Promise<void> {
  consola.info("字体子集化构建工具");

  // 加载配置
  const config = await loadConfig();
  const baseVersion = getVersion(config.version);
  consola.info(`   版本基线: ${baseVersion}`);
  consola.info(`   格式: ${config.output.format}`);

  // 临时输出目录（用于字体子集文件）
  const tempDir = path.join(config.cacheDir, "subsets");
  fs.mkdirSync(tempDir, { recursive: true });

  // 下载字体
  const fontPathMap = await downloadFonts(config.cacheDir, config.fonts);

  if (fontPathMap.size === 0) {
    consola.error("没有可用的字体文件，构建失败");
    process.exit(1);
  }

  // 收集字符
  const chars = await collectChars(config);

  // 生成字体子集
  const fontGroupMap = await generateFontSubset(
    fontPathMap,
    tempDir,
    chars,
    config.fonts,
    config.output.format
  );

  // 统计字体文件
  let totalFontSize = 0;
  let fontCount = 0;
  for (const subsets of fontGroupMap.values()) {
    for (const subset of subsets) {
      totalFontSize += subset.size;
      fontCount++;
    }
  }
  const totalFontSizeKB = (totalFontSize / 1024).toFixed(2);

  consola.success("字体子集生成完成!");
  consola.info(`   生成文件: ${fontCount} 个`);
  consola.info(`   总大小: ${totalFontSizeKB} KB`);

  const version = baseVersion;
  consola.info(`   字体版本: ${version}`);

  // 生成样式文件
  await generateFontCss(fontGroupMap, config, version, config.output.format);

  // 上传到 CDN
  const fontFiles: string[] = [];
  for (const subsets of fontGroupMap.values()) {
    for (const subset of subsets) {
      fontFiles.push(subset.filePath);
    }
  }
  await uploadToCDN(fontFiles, version, config);

  // 清理临时文件
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

main().catch(consola.error);
