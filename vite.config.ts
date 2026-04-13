import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "src/**/*.{ts,js,mjs,cjs}": "vp check --fix",
    "vite.config.ts": "vp check --fix",
    "package.json": "vp check --fix",
    "README.md": "vp check --fix"
  },
  pack: {
    entry: [
      "src/config/loader.ts",
      "src/config/index.ts",
      "src/vite/index.ts",
      "src/cli.ts",
      "src/client.ts"
    ],
    outDir: "dist",
    dts: true,
    exports: {
      packageJson: false
    },
    format: ["esm", "cjs"],
    minify: true
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true
    }
  },
  fmt: {
    trailingComma: "none"
  }
});
