import type {
  UploadFileInput,
  UploadFileResult,
  UploadProvider
} from "../../src/uploader/providers/abstract";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const createUploaderMock = vi.fn();

vi.mock("../../src/uploader/factory", () => ({
  createUploader: createUploaderMock
}));

const { uploadToCDN } = await import("../../src/uploader");

describe("uploader/index", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create uploader once and upload only valid files", async () => {
    const calls: string[] = [];
    const uploader: UploadProvider = {
      validateConfig: vi.fn(),
      create: vi.fn(),
      uploadFile: vi.fn(async (file: UploadFileInput): Promise<UploadFileResult> => {
        calls.push(file.fileName);
        return { status: "uploaded" };
      }),
      finalize: vi.fn()
    };
    createUploaderMock.mockReturnValue(uploader);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "font-builder-upload-"));
    const validFile = path.join(tempDir, "a.woff2");
    const emptyFile = path.join(tempDir, "empty.woff2");
    fs.writeFileSync(validFile, "abc", "utf-8");
    fs.writeFileSync(emptyFile, "", "utf-8");

    const files = [validFile, emptyFile, path.join(tempDir, "missing.woff2")];
    await uploadToCDN(files, "1.0.0", {
      upload: { provider: "cos", concurrency: 2 },
      cos: {},
      scan: { srcDir: [], extensions: [] },
      fonts: [],
      output: {
        cssDir: "src/styles",
        format: "woff2",
        styleFormat: "scss"
      },
      root: process.cwd(),
      cacheDir: "/tmp"
    } as any);

    expect(createUploaderMock).toHaveBeenCalledTimes(1);
    expect(uploader.create).toHaveBeenCalledTimes(1);
    expect(uploader.uploadFile).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["a.woff2"]);
    expect(uploader.finalize).toHaveBeenCalledTimes(1);
  });

  it("should limit upload concurrency", async () => {
    let active = 0;
    let maxActive = 0;

    const uploader: UploadProvider = {
      validateConfig: vi.fn(),
      create: vi.fn(),
      uploadFile: vi.fn(async (_file: UploadFileInput): Promise<UploadFileResult> => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 30));
        active--;
        return { status: "uploaded" };
      }),
      finalize: vi.fn()
    };
    createUploaderMock.mockReturnValue(uploader);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "font-builder-concurrency-"));
    const files = Array.from({ length: 6 }, (_, i) => {
      const file = path.join(tempDir, `f${i}.woff2`);
      fs.writeFileSync(file, `font-${i}`, "utf-8");
      return file;
    });

    await uploadToCDN(files, "1.0.0", {
      upload: { provider: "cos", concurrency: 2 },
      cos: {},
      scan: { srcDir: [], extensions: [] },
      fonts: [],
      output: {
        cssDir: "src/styles",
        format: "woff2",
        styleFormat: "scss"
      },
      root: process.cwd(),
      cacheDir: "/tmp"
    } as any);

    expect(maxActive).toBeLessThanOrEqual(2);
    expect(maxActive).toBeGreaterThan(1);
  });
});
