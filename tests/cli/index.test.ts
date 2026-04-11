import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { loadConfig } from "../../src/config/loader";
import { downloadFonts } from "../../src/core/download";
import { collectChars } from "../../src/core/scan";
import { generateFontSubset } from "../../src/core/subset";
import { generateFontCss } from "../../src/core/generate-css";
import { uploadToCDN } from "../../src/uploader";

vi.mock("../../src/config/loader", () => ({
  loadConfig: vi.fn(),
  getVersion: vi.fn(),
}));

vi.mock("../../src/core/download", () => ({
  downloadFonts: vi.fn(),
}));

vi.mock("../../src/core/scan", () => ({
  collectChars: vi.fn(),
}));

vi.mock("../../src/core/subset", () => ({
  generateFontSubset: vi.fn(),
}));

vi.mock("../../src/core/generate-css", () => ({
  generateFontCss: vi.fn(),
}));

vi.mock("../../src/uploader", () => ({
  uploadToCDN: vi.fn(),
}));

describe("cli dependencies", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("loadConfig", () => {
    it("should return resolved config", async () => {
      const mockConfig = {
        version: "1.0.0",
        fonts: [{ family: "Test", name: "Regular", weight: 400, url: "http://test.com/font.ttf" }],
        output: { format: "woff" as const, styleFormat: "scss" as const, cssDir: "src/styles" },
        scan: { srcDir: ["src"], extensions: ["vue", "ts"], extraText: "" },
        upload: { provider: "cos" as const, concurrency: 5 },
        cos: {},
        root: process.cwd(),
        cacheDir: path.join(os.tmpdir(), "test-cache"),
      };

      (loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfig);

      const config = await loadConfig();

      expect(config.fonts).toHaveLength(1);
      expect(config.output.format).toBe("woff");
    });
  });

  describe("downloadFonts", () => {
    it("should be called with noCache option", async () => {
      const fontPathMap = new Map([["Test-400", "/path/to/font.ttf"]]);
      (downloadFonts as ReturnType<typeof vi.fn>).mockResolvedValue(fontPathMap);

      const fonts = [{ family: "Test", name: "Regular", weight: 400, url: "http://test.com/font.ttf" }];
      const cacheDir = os.tmpdir();

      await downloadFonts(cacheDir, fonts, true);

      expect(downloadFonts).toHaveBeenCalledWith(cacheDir, fonts, true);
    });

    it("should be called without noCache option", async () => {
      const fontPathMap = new Map([["Test-400", "/path/to/font.ttf"]]);
      (downloadFonts as ReturnType<typeof vi.fn>).mockResolvedValue(fontPathMap);

      const fonts = [{ family: "Test", name: "Regular", weight: 400, url: "http://test.com/font.ttf" }];
      const cacheDir = os.tmpdir();

      await downloadFonts(cacheDir, fonts, false);

      expect(downloadFonts).toHaveBeenCalledWith(cacheDir, fonts, false);
    });
  });

  describe("collectChars", () => {
    it("should return char set", async () => {
      const charSet = new Set(["你", "好", "a", "1"]);
      (collectChars as ReturnType<typeof vi.fn>).mockResolvedValue(charSet);

      const result = await collectChars({} as any);

      expect(result).toBe(charSet);
    });
  });

  describe("generateFontSubset", () => {
    it("should be called with correct parameters", async () => {
      const fontPathMap = new Map([["Test-400", "/path/to/font.ttf"]]);
      const charSet = new Set(["你", "好"]);
      const fontGroupMap = new Map();

      (generateFontSubset as ReturnType<typeof vi.fn>).mockResolvedValue(fontGroupMap);

      const fonts = [{ family: "Test", name: "Regular", weight: 400, url: "http://test.com/font.ttf" }];
      const tempDir = os.tmpdir();

      await generateFontSubset(fontPathMap, tempDir, charSet, fonts, "woff");

      expect(generateFontSubset).toHaveBeenCalledWith(fontPathMap, tempDir, charSet, fonts, "woff");
    });
  });

  describe("generateFontCss", () => {
    it("should be called with correct version", async () => {
      (generateFontCss as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const fontGroupMap = new Map();
      const config = {
        output: { cssDir: "src/styles", format: "woff" as const, styleFormat: "scss" as const },
        root: process.cwd(),
      };

      await generateFontCss(fontGroupMap, config as any, "2.0.0", "woff");

      expect(generateFontCss).toHaveBeenCalledWith(fontGroupMap, config, "2.0.0", "woff");
    });
  });

  describe("uploadToCDN", () => {
    it("should be called with font files", async () => {
      (uploadToCDN as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const fontFiles = ["/path/to/font1.woff", "/path/to/font2.woff"];
      const config = {
        upload: { provider: "cos" as const, concurrency: 5 },
        cos: { secretId: "test", secretKey: "test", bucket: "test", region: "ap-guangzhou" },
      };

      await uploadToCDN(fontFiles, "1.0.0", config as any);

      expect(uploadToCDN).toHaveBeenCalledWith(fontFiles, "1.0.0", config);
    });
  });
});
