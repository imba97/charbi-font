import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { ResolvedConfig } from "../../src/config/schema";
import {
  buildFontFaces,
  resolveBuildFontVersion,
  resolveCharbiRuntime,
  resolveFontAssetBaseUrl,
  serializeCharbiRuntimeAsEsm
} from "../../src/runtime";

vi.mock("../../src/config/loader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config/loader")>();
  return {
    ...actual,
    loadConfig: vi.fn()
  };
});

import { loadConfig } from "../../src/config/loader";

const originalCwd = process.cwd();
const originalViteFontVersion = process.env.VITE_FONT_BUILD_VERSION;

afterEach(() => {
  process.chdir(originalCwd);
  if (originalViteFontVersion === undefined) {
    delete process.env.VITE_FONT_BUILD_VERSION;
  } else {
    process.env.VITE_FONT_BUILD_VERSION = originalViteFontVersion;
  }
  vi.clearAllMocks();
});

function mockResolvedConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    scan: { srcDir: ["src"], extensions: ["vue"] },
    fonts: [
      {
        family: "Alibaba PuHuiTi",
        name: "Regular",
        weight: 400,
        url: "https://example.com/font.ttf"
      },
      {
        family: "DelaGothicOne",
        name: "Regular",
        weight: 400,
        url: "https://example.com/dela.ttf",
        format: "ttf"
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

describe("runtime", () => {
  it("resolveBuildFontVersion prefers VITE_FONT_BUILD_VERSION", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "charbi-runtime-"));
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "demo", version: "1.2.3" }),
      "utf-8"
    );
    process.chdir(tempDir);
    process.env.VITE_FONT_BUILD_VERSION = "9.9.9";

    expect(resolveBuildFontVersion(tempDir)).toBe("9.9.9");
  });

  it("resolveBuildFontVersion falls back to package.json version", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "charbi-runtime-"));
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "demo", version: "0.0.84" }),
      "utf-8"
    );

    expect(resolveBuildFontVersion(tempDir)).toBe("0.0.84");
  });

  it("buildFontFaces derives file names from config", () => {
    const config = mockResolvedConfig();
    const faces = buildFontFaces(config);

    expect(faces).toEqual([
      {
        family: "Alibaba PuHuiTi",
        file: "AlibabaPuHuiTi-400.woff2",
        weight: "400",
        style: "normal",
        variant: "normal"
      },
      {
        family: "DelaGothicOne",
        file: "DelaGothicOne-400.ttf",
        weight: "400",
        style: "normal",
        variant: "normal"
      }
    ]);
  });

  it("resolveFontAssetBaseUrl substitutes version in basePath", () => {
    const config = mockResolvedConfig();
    expect(resolveFontAssetBaseUrl(config, "1.0.0")).toBe(
      "https://cdn.example.com/static/fonts/built/1.0.0"
    );
  });

  it("resolveFontAssetBaseUrl returns undefined when cos is incomplete", () => {
    const config = mockResolvedConfig({ cos: { cdnUrl: "https://cdn.example.com" } });
    expect(resolveFontAssetBaseUrl(config, "1.0.0")).toBeUndefined();
  });

  it("resolveCharbiRuntime returns virtual module equivalent fields", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "charbi-runtime-"));
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "demo", version: "0.0.84" }),
      "utf-8"
    );
    const config = mockResolvedConfig({ root: tempDir });
    (loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue(config);

    const runtime = await resolveCharbiRuntime({ root: tempDir, mode: "development" });

    expect(runtime.FONT_BUILD_VERSION).toBe("0.0.84");
    expect(runtime.BUILD_FONT_FACES).toHaveLength(2);
    expect(runtime.FONT_ASSET_BASE_URL).toBe(
      "https://cdn.example.com/static/fonts/built/0.0.84"
    );
  });

  it("serializeCharbiRuntimeAsEsm produces importable exports", () => {
    const runtime = {
      FONT_BUILD_VERSION: "1.0.0",
      BUILD_FONT_FACES: [
        {
          family: "Test",
          file: "Test-400.woff2",
          weight: "400",
          style: "normal" as const,
          variant: "normal" as const
        }
      ],
      FONT_ASSET_BASE_URL: "https://cdn.example.com/fonts/1.0.0"
    };

    const code = serializeCharbiRuntimeAsEsm(runtime);
    expect(code).toContain('export const FONT_BUILD_VERSION = "1.0.0"');
    expect(code).toContain("export const BUILD_FONT_FACES = ");
    expect(code).toContain(
      'export const FONT_ASSET_BASE_URL = "https://cdn.example.com/fonts/1.0.0"'
    );
  });
});
