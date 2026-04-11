import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export interface VitePluginLike {
  name: string;
  resolveId?: (id: string) => string | null;
  load?: (id: string) => string | null;
}

function resolveProjectPackageVersion(): string | undefined {
  const pkgPath = path.join(process.cwd(), "package.json");
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

function resolveBuildFontVersion(): string {
  return (
    process.env.VITE_FONT_BUILD_VERSION ||
    resolveProjectPackageVersion() ||
    process.env.npm_package_version ||
    "0.0.1"
  );
}

export default function UniBuildFont(buildFontVersion = resolveBuildFontVersion()): VitePluginLike {
  return {
    name: "virtual-charbi",
    resolveId(id: string) {
      if (id === "virtual:charbi") return "\0virtual:charbi";
      return null;
    },
    load(id: string) {
      if (id === "\0virtual:charbi") {
        return `export const FONT_BUILD_VERSION = ${JSON.stringify(buildFontVersion)}`;
      }
      return null;
    }
  };
}
