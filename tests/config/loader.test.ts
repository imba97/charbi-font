import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { getCacheDir, getProjectRoot, getVersion } from "../../src/config/loader";

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

describe("loader", () => {
  it("getProjectRoot should use caller project cwd", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "font-builder-root-"));
    process.chdir(tempDir);

    expect(fs.realpathSync(getProjectRoot())).toBe(fs.realpathSync(tempDir));
  });

  it("getCacheDir without userCacheDir resolves to scoped package under node_modules", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "font-builder-cache-"));
    process.chdir(tempDir);
    const dir = getCacheDir(undefined, tempDir);
    expect(dir).toBe(path.join(tempDir, "node_modules", "@uiron", "charbi", ".cache", "fonts"));
  });

  it("getVersion should read version from caller package.json", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "font-builder-version-"));
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "demo-app", version: "1.2.3" }),
      "utf-8"
    );
    process.chdir(tempDir);

    expect(getVersion()).toBe("1.2.3");
  });
});
