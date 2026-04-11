import type { ResolvedConfig } from "../../config/schema";

export interface UploadFileInput {
  filePath: string;
  fileName: string;
  sizeKB: string;
}

export interface UploadFileResult {
  status: "uploaded" | "skipped";
}

export interface UploadProvider {
  validateConfig: (config: ResolvedConfig) => void;
  create: (version: string, config: ResolvedConfig) => Promise<void>;
  uploadFile: (file: UploadFileInput) => Promise<UploadFileResult>;
  finalize: () => void;
}
