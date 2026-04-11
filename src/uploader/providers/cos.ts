import type { ResolvedConfig } from "../../config/schema";
import type { UploadFileInput, UploadFileResult, UploadProvider } from "./abstract";
import fs from "node:fs";
import consola from "consola";
import enquirer from "enquirer";

interface FullCOSConfig {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  uploadPath: string;
  cdnUrl: string;
  overwrite: boolean;
}

async function collectCOSConfig(
  version: string,
  defaultConfig: ResolvedConfig["cos"]
): Promise<FullCOSConfig> {
  if (!defaultConfig.basePath) {
    throw new Error("COS 配置缺少 basePath，请在 fonts.config.ts 中设置 cos.basePath");
  }
  if (!defaultConfig.bucket) {
    throw new Error("COS 配置缺少 bucket，请在 fonts.config.ts 中设置 cos.bucket");
  }
  if (!defaultConfig.region) {
    throw new Error("COS 配置缺少 region，请在 fonts.config.ts 中设置 cos.region");
  }
  if (!defaultConfig.cdnUrl) {
    throw new Error("COS 配置缺少 cdnUrl，请在 fonts.config.ts 中设置 cos.cdnUrl");
  }

  const uploadPath = defaultConfig.basePath.replace("{version}", version);
  const questions: any[] = [];

  if (!defaultConfig.secretId) {
    questions.push({
      type: "input",
      name: "secretId",
      message: "请输入腾讯云 SecretId:",
      validate: (value: string) => value.length > 0 || "SecretId 不能为空"
    });
  }

  if (!defaultConfig.secretKey) {
    questions.push({
      type: "password",
      name: "secretKey",
      message: "请输入腾讯云 SecretKey:",
      validate: (value: string) => value.length > 0 || "SecretKey 不能为空"
    });
  }

  if (defaultConfig.overwrite === undefined) {
    questions.push({
      type: "confirm",
      name: "overwrite",
      message: "如果文件已存在，是否覆盖?",
      initial: false
    });
  }

  const answers = questions.length > 0 ? await enquirer.prompt<any>(questions) : {};

  return {
    secretId: defaultConfig.secretId || answers.secretId,
    secretKey: defaultConfig.secretKey || answers.secretKey,
    bucket: defaultConfig.bucket,
    region: defaultConfig.region,
    uploadPath,
    cdnUrl: defaultConfig.cdnUrl,
    overwrite: defaultConfig.overwrite ?? answers.overwrite ?? false
  };
}

async function loadCOSSDK() {
  try {
    const mod = await import("cos-nodejs-sdk-v5");
    return (mod as any).default || mod;
  } catch {
    throw new Error("缺少依赖 cos-nodejs-sdk-v5，请在使用项目中安装该包后重试");
  }
}

export class COSUploader implements UploadProvider {
  private cos: any;
  private cosConfig!: FullCOSConfig;

  validateConfig(config: ResolvedConfig): void {
    if (!config.cos.basePath || !config.cos.bucket || !config.cos.region || !config.cos.cdnUrl) {
      throw new Error("COS 上传配置不完整，请检查 fonts.config.ts 中的 cos 配置");
    }
  }

  async create(version: string, config: ResolvedConfig): Promise<void> {
    this.cosConfig = await collectCOSConfig(version, config.cos);
    const COS = await loadCOSSDK();

    this.cos = new COS({
      SecretId: this.cosConfig.secretId,
      SecretKey: this.cosConfig.secretKey
    });

    consola.info("开始上传到 COS...");
    consola.info(`   Bucket: ${this.cosConfig.bucket}`);
    consola.info(`   区域: ${this.cosConfig.region}`);
    consola.info(`   路径: ${this.cosConfig.uploadPath}`);
  }

  async uploadFile(file: UploadFileInput): Promise<UploadFileResult> {
    const cosPath = `${this.cosConfig.uploadPath}/${file.fileName}`.replace(/\/+/g, "/");

    if (!this.cosConfig.overwrite) {
      try {
        await this.cos.headObject({
          Bucket: this.cosConfig.bucket,
          Region: this.cosConfig.region,
          Key: cosPath
        });
        return { status: "skipped" };
      } catch {
        // 文件不存在，继续上传
      }
    }

    await this.cos.putObject({
      Bucket: this.cosConfig.bucket,
      Region: this.cosConfig.region,
      Key: cosPath,
      StorageClass: "STANDARD",
      Body: fs.createReadStream(file.filePath)
    });

    return { status: "uploaded" };
  }

  finalize(): void {
    consola.success("上传完成!");
    consola.info(`   CDN 地址: ${this.cosConfig.cdnUrl}${this.cosConfig.uploadPath}/`);
  }
}
