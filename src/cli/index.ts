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
import { FONT_ASSETS_DIR } from "../config/schema";
import { getVersion, loadConfig } from "../config/loader";
import consola from "consola";

interface BuildOptions {
  cache?: boolean;
}

interface GlobalOptions {
  mode?: "development" | "production";
}

const __dirname = path.dirname(
  (() => {
    try {
      return fs.realpathSync(fileURLToPath(import.meta.url));
    } catch {
      return fileURLToPath(import.meta.url);
    }
  })()
);
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"));

const cli = new CAC("charbi");

cli.version(pkg.version);
cli.option("--mode <mode>", "development 或 production");

// 默认命令：build + upload
cli.command("").action(runAll);

// build 命令：只打包
cli.command("build").option("--no-cache", "强制重新下载字体文件").action(runBuild);

// upload 命令：只上传
cli.command("upload").action(runUpload);

async function runAll(_options: unknown, globalOptions?: GlobalOptions) {
  await runBuild({ cache: true } as BuildOptions, globalOptions);
  await runUpload(undefined, globalOptions);
}

async function runBuild(options: BuildOptions, globalOptions?: GlobalOptions) {
  const mode = globalOptions?.mode || "development";
  const config = await loadConfig(mode);
  const baseVersion = getVersion(config.version);

  consola.info("charbi");
  consola.info(`   模式: ${mode}`);
  consola.info(`   版本基线: ${baseVersion}`);
  consola.info(`   格式: ${config.output.format}`);

  // 字体文件输出目录（src/styles/font-assets/）
  const assetsDir = path.join(config.root, config.output.cssDir, FONT_ASSETS_DIR);
  fs.mkdirSync(assetsDir, { recursive: true });

  const fontPathMap = await downloadFonts(config.cacheDir, config.fonts, !options.cache);

  if (fontPathMap.size === 0) {
    consola.error("没有可用的字体文件，构建失败");
    process.exit(1);
  }

  const chars = await collectChars(config);

  const fontGroupMap = await generateFontSubset(
    fontPathMap,
    assetsDir,
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
  consola.info(`   输出目录: ${assetsDir}`);

  const versionStr = baseVersion;
  consola.info(`   字体版本: ${versionStr}`);

  await generateFontCss(fontGroupMap, config, versionStr, config.output.format);
}

async function runUpload(_options: unknown, globalOptions?: GlobalOptions) {
  const mode = globalOptions?.mode || "development";
  const config = await loadConfig(mode);
  const baseVersion = getVersion(config.version);
  const versionStr = baseVersion;

  consola.info("charbi upload");
  consola.info(`   模式: ${mode}`);
  consola.info(`   版本: ${versionStr}`);

  // 从 font-assets 目录读取字体文件
  const assetsDir = path.join(config.root, config.output.cssDir, FONT_ASSETS_DIR);

  if (!fs.existsSync(assetsDir)) {
    consola.error(`没有找到字体文件目录: ${assetsDir}`);
    consola.error("请先执行 build 命令");
    process.exit(1);
  }

  const fontFiles: string[] = [];
  for (const entry of fs.readdirSync(assetsDir)) {
    const filePath = path.join(assetsDir, entry);
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
