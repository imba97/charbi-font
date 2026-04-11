import { CAC } from "cac";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { downloadFonts } from "../core/download";
import { generateFontCss } from "../core/generate-css";
import { collectChars } from "../core/scan";
import { generateFontSubset } from "../core/subset";
import { uploadToCDN } from "../uploader";
import { getVersion, loadConfig } from "../config/loader";
import consola from "consola";

interface BuildOptions {
  cache?: boolean;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"));

const cli = new CAC("charbi");

cli.version(pkg.version);

cli.command("").action(runBuild);

cli.command("build").option("--no-cache", "强制重新下载字体文件").action(runBuild);

cli.command("upload").action(runUpload);

async function runBuild(options: BuildOptions) {
  const config = await loadConfig();
  const baseVersion = getVersion(config.version);

  consola.info("charbi");
  consola.info(`   版本基线: ${baseVersion}`);
  consola.info(`   格式: ${config.output.format}`);

  const tempDir = path.join(config.cacheDir, "subsets");
  fs.mkdirSync(tempDir, { recursive: true });

  const fontPathMap = await downloadFonts(config.cacheDir, config.fonts, !options.cache);

  if (fontPathMap.size === 0) {
    consola.error("没有可用的字体文件，构建失败");
    process.exit(1);
  }

  const chars = await collectChars(config);

  const fontGroupMap = await generateFontSubset(
    fontPathMap,
    tempDir,
    chars,
    config.fonts,
    config.output.format
  );

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

  const versionStr = baseVersion;
  consola.info(`   字体版本: ${versionStr}`);

  await generateFontCss(fontGroupMap, config, versionStr, config.output.format);

  const fontFiles: string[] = [];
  for (const subsets of fontGroupMap.values()) {
    for (const subset of subsets) {
      fontFiles.push(subset.filePath);
    }
  }
  await uploadToCDN(fontFiles, versionStr, config);

  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

async function runUpload() {
  const config = await loadConfig();
  const baseVersion = getVersion(config.version);
  const versionStr = baseVersion;

  consola.info("charbi upload");
  consola.info(`   版本: ${versionStr}`);

  const tempDir = path.join(config.cacheDir, "subsets");

  const fontFiles: string[] = [];
  for (const entry of fs.readdirSync(tempDir)) {
    const filePath = path.join(tempDir, entry);
    if (fs.statSync(filePath).isFile()) {
      fontFiles.push(filePath);
    }
  }

  if (fontFiles.length === 0) {
    consola.error("没有找到字体文件，请先执行 build");
    process.exit(1);
  }

  await uploadToCDN(fontFiles, versionStr, config);
}

cli.help();
cli.parse();
