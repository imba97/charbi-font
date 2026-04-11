import type { ResolvedConfig } from "../config/schema";
import type { UploadProvider } from "./providers/abstract";
import { COSUploader } from "./providers/cos";

export function createUploader(config: ResolvedConfig): UploadProvider {
  switch (config.upload.provider || "cos") {
    case "cos":
      return new COSUploader();
    default:
      throw new Error(`不支持的上传 provider: ${config.upload.provider}`);
  }
}
