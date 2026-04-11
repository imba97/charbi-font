import { describe, expect, it } from "vite-plus/test";
import { createUploader } from "../../src/uploader/factory";

describe("uploader/factory", () => {
  it("should create COS uploader by default", () => {
    const uploader = createUploader({
      upload: {},
      cos: {},
      scan: { srcDir: [], extensions: [] },
      fonts: [],
      output: {
        cssDir: "src/styles",
        mode: "url",
        format: "woff2",
        styleFormat: "scss"
      },
      root: process.cwd(),
      cacheDir: "/tmp"
    } as any);

    expect(uploader).toBeTruthy();
    expect(typeof uploader.create).toBe("function");
    expect(typeof uploader.uploadFile).toBe("function");
  });

  it("should throw when provider is unsupported", () => {
    expect(() =>
      createUploader({
        upload: { provider: "mock" as any },
        cos: {},
        scan: { srcDir: [], extensions: [] },
        fonts: [],
        output: {
          cssDir: "src/styles",
          mode: "url",
          format: "woff2",
          styleFormat: "scss"
        },
        root: process.cwd(),
        cacheDir: "/tmp"
      } as any)
    ).toThrow("不支持的上传 provider");
  });
});
