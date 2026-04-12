import type { FontConfig } from "../config/schema";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import consola from "consola";

// 下载文件
async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          // 删除可能创建的空文件
          file.close();
          fs.unlink(destPath, () => {});
          reject(new Error(`下载失败: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          // 验证文件大小，确保不是空文件
          const stats = fs.statSync(destPath);
          if (stats.size === 0) {
            fs.unlink(destPath, () => {});
            reject(new Error("下载的文件为空"));
            return;
          }
          resolve();
        });
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

// 下载字体文件
export async function downloadFonts(
  cacheDir: string,
  fonts: FontConfig[],
  noCache = false
): Promise<Map<string, string>> {
  consola.info("下载字体文件...");
  consola.info(`   缓存目录: ${cacheDir}`);

  fs.mkdirSync(cacheDir, { recursive: true });

  const fontPathMap = new Map<string, string>();

  for (const font of fonts) {
    const fileName = `${font.family}-${font.weight}.ttf`;
    const cachePath = path.join(cacheDir, fileName);

    // 清除缓存
    if (noCache && fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }

    // 检查缓存
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      // 验证缓存文件大小，空文件则删除并重新下载
      if (stats.size === 0) {
        fs.unlinkSync(cachePath);
      } else {
        const sizeKB = (stats.size / 1024).toFixed(2);
        consola.info(`   ✓ ${font.family} ${font.name} (缓存, ${sizeKB} KB)`);
        fontPathMap.set(`${font.family}-${font.weight}`, cachePath);
        continue;
      }
    }

    // 下载
    consola.info(`   ↓ ${font.family} ${font.name}...`);
    try {
      await downloadFile(font.url, cachePath);
      const stats = fs.statSync(cachePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      consola.success(`     完成 ${fileName} (${sizeKB} KB)`);
      fontPathMap.set(`${font.family}-${font.weight}`, cachePath);
    } catch (error: any) {
      consola.error(`     失败 ${font.family} ${font.name} 下载失败:`, error.message);
      // 确保删除失败的文件
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
      }
    }
  }

  return fontPathMap;
}
