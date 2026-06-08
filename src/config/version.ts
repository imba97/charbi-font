import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function resolveProjectPackageVersion(projectRoot: string): string | undefined {
  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return undefined;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (typeof pkg?.version === "string" && pkg.version.length > 0) {
      return pkg.version;
    }
  } catch {
    // ignore and fallback
  }

  return undefined;
}

/** 版本号：VITE_FONT_BUILD_VERSION → package.json → npm_package_version → 0.0.1 */
export function resolveBuildFontVersion(projectRoot: string = process.cwd()): string {
  return (
    process.env.VITE_FONT_BUILD_VERSION ||
    resolveProjectPackageVersion(projectRoot) ||
    process.env.npm_package_version ||
    "0.0.1"
  );
}

/** userVersion 优先，否则 resolveBuildFontVersion */
export function getVersion(userVersion?: string, projectRoot?: string): string {
  if (userVersion) return userVersion;
  return resolveBuildFontVersion(projectRoot ?? process.cwd());
}
