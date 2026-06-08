import type { ResolvedConfig } from "../../src/config/schema";
import { describe, expect, it } from "vite-plus/test";
import { resolveFontAssetBaseUrl, resolveFontFileUrl } from "../../src/utils/font-url";

function mockResolvedConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    scan: { srcDir: ["src"], extensions: ["vue"] },
    fonts: [
      {
        family: "Alibaba PuHuiTi",
        name: "Regular",
        weight: 400,
        url: "https://example.com/font.ttf"
      }
    ],
    output: { format: "woff2", cssDir: "src/styles" },
    upload: { provider: "cos", concurrency: 5 },
    cos: {
      cdnUrl: "https://cdn.example.com",
      basePath: "static/fonts/built/{version}"
    },
    root: process.cwd(),
    cacheDir: "/tmp/cache",
    version: undefined,
    env: {},
    mode: "development",
    ...overrides
  };
}

describe("font-url", () => {
  it("resolveFontAssetBaseUrl substitutes version in basePath", () => {
    const config = mockResolvedConfig();
    expect(resolveFontAssetBaseUrl(config, "1.0.0")).toBe(
      "https://cdn.example.com/static/fonts/built/1.0.0"
    );
  });

  it("resolveFontFileUrl appends filename to CDN base", () => {
    const config = mockResolvedConfig();
    const font = config.fonts[0];
    expect(resolveFontFileUrl(config, font, "1.0.0", "woff2")).toBe(
      "https://cdn.example.com/static/fonts/built/1.0.0/AlibabaPuHuiTi-400.woff2"
    );
  });

  it("resolveFontFileUrl returns local path when cos.cdnUrl is absent", () => {
    const config = mockResolvedConfig({ cos: {} });
    const font = config.fonts[0];
    expect(resolveFontFileUrl(config, font, "1.0.0", "woff2")).toBe(
      "./fonts/AlibabaPuHuiTi-400.woff2"
    );
  });
});
