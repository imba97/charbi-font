import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { exportFontWordFiles } from "../../src/core/export-words";

describe("export-words", () => {
  let dir = "";

  afterEach(() => {
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
      dir = "";
    }
  });

  it("writes scan chars plus per-font extraText", async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "charbi-words-"));
    const chars = new Set(["你", "好"]);
    const fonts = [
      { family: "Alibaba PuHuiTi", name: "Regular", weight: 400, url: "x", extraText: "！" },
      { family: "Alibaba PuHuiTi", name: "Black", weight: 900, url: "y" }
    ];

    await exportFontWordFiles(chars, fonts, dir);

    const regular = fs.readFileSync(path.join(dir, "AlibabaPuHuiTi-400.txt"), "utf-8");
    const black = fs.readFileSync(path.join(dir, "AlibabaPuHuiTi-900.txt"), "utf-8");

    expect(regular).toBe("你好！");
    expect(black).toBe("你好");
  });
});
