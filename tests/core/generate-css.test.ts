import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { generateFontCss } from "../../src/core/generate-css";

describe("generateFontCss format mapping", () => {
  it("should map common formats to correct extension and css format", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "charbi-css-"));
    try {
      const config = {
        root,
        output: {
          cssDir: "src/styles",
          format: "woff2",
          styleFormat: "scss"
        },
        cos: {
          cdnUrl: "https://cdn.example.com",
          basePath: "/static/fonts/{version}"
        }
      } as any;

      const fontGroupMap = new Map([
        [
          "DemoFont",
          [
            {
              config: { family: "DemoFont", name: "R400", weight: 400, style: "normal" },
              size: 100,
              filePath: "",
              format: "truetype"
            },
            {
              config: { family: "DemoFont", name: "R500", weight: 500, style: "normal" },
              size: 100,
              filePath: "",
              format: "opentype"
            },
            {
              config: { family: "DemoFont", name: "R600", weight: 600, style: "normal" },
              size: 100,
              filePath: "",
              format: "embedded-opentype"
            },
            {
              config: { family: "DemoFont", name: "R700", weight: 700, style: "normal" },
              size: 100,
              filePath: "",
              format: "woff"
            },
            {
              config: { family: "DemoFont", name: "R800", weight: 800, style: "normal" },
              size: 100,
              filePath: "",
              format: "woff2"
            },
            {
              config: { family: "DemoFont", name: "R900", weight: 900, style: "normal" },
              size: 100,
              filePath: "",
              format: "svg"
            }
          ]
        ]
      ]) as any;

      await generateFontCss(fontGroupMap, config, "1.2.3", "woff2");

      const css = fs.readFileSync(
        path.join(root, "src/styles/font-assets/demo-font.scss"),
        "utf-8"
      );

      expect(css).toContain("DemoFont-400.ttf') format('truetype')");
      expect(css).toContain("DemoFont-500.otf') format('opentype')");
      expect(css).toContain("DemoFont-600.eot') format('embedded-opentype')");
      expect(css).toContain("DemoFont-700.woff') format('woff')");
      expect(css).toContain("DemoFont-800.woff2') format('woff2')");
      expect(css).toContain("DemoFont-900.svg') format('svg')");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("should fallback to css when styleFormat is not provided", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "charbi-css-default-"));
    try {
      const config = {
        root,
        output: {
          cssDir: "src/styles",
          format: "woff2"
        },
        cos: {
          cdnUrl: "https://cdn.example.com",
          basePath: "/static/fonts/{version}"
        }
      } as any;

      const fontGroupMap = new Map([
        [
          "DemoFont",
          [
            {
              config: { family: "DemoFont", name: "R400", weight: 400, style: "normal" },
              size: 100,
              filePath: "",
              format: "woff2"
            }
          ]
        ]
      ]) as any;

      await generateFontCss(fontGroupMap, config, "1.2.3", "woff2");

      const assetCssPath = path.join(root, "src/styles/font-assets/demo-font.css");
      const indexCssPath = path.join(root, "src/styles/fonts.css");
      const indexCss = fs.readFileSync(indexCssPath, "utf-8");

      expect(fs.existsSync(assetCssPath)).toBe(true);
      expect(fs.existsSync(indexCssPath)).toBe(true);
      expect(indexCss).toContain("@import './font-assets/demo-font';");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
