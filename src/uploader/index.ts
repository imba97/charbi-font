import type { ResolvedConfig } from "../config/schema";
import fs from "node:fs";
import path from "node:path";
import consola from "consola";
import pLimit from "p-limit";
import { createUploader } from "./factory";

export async function uploadToCDN(
  files: string[],
  version: string,
  config: ResolvedConfig
): Promise<void> {
  const uploader = createUploader(config);
  uploader.validateConfig(config);

  const validFiles = files
    .filter((file) => {
      if (!fs.existsSync(file)) return false;
      const stats = fs.statSync(file);
      return stats.size > 0;
    })
    .map((file) => {
      const stats = fs.statSync(file);
      return {
        filePath: file,
        fileName: path.basename(file),
        sizeKB: (stats.size / 1024).toFixed(2)
      };
    });

  if (validFiles.length === 0) {
    consola.error("没有有效的文件可上传");
    return;
  }

  await uploader.create(version, config);

  const limit = pLimit(config.upload.concurrency ?? 5);
  await Promise.all(
    validFiles.map((file) =>
      limit(async () => {
        try {
          const result = await uploader.uploadFile(file);
          if (result.status === "skipped") {
            consola.info(`   跳过 ${file.fileName} (远端已存在)`);
          } else {
            consola.success(`   完成 ${file.fileName} (${file.sizeKB} KB)`);
          }
        } catch (error: any) {
          consola.error(`   失败 ${file.fileName} 上传失败:`, error.message);
        }
      })
    )
  );

  uploader.finalize();
}
