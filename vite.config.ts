import { defineConfig } from "vite-plus";
import mergeVirtualCharbiClientDts from "./scripts/vite-plugins/merge-virtual-charbi-client-dts/index.ts";

export default defineConfig({
  staged: {
    "src/**/*.{ts,js,mjs,cjs}": "vp check --fix",
    "vite.config.ts": "vp check --fix",
    "scripts/**/*.ts": "vp check --fix",
    "package.json": "vp check --fix",
    "README.md": "vp check --fix"
  },
  pack: {
    entry: {
      config: "./src/config/index.ts",
      loader: "./src/config/loader.ts",
      runtime: "./src/runtime/index.ts",
      vite: "./src/vite/index.ts",
      cli: "./src/cli/index.ts",
      client: "./src/client/index.ts"
    },
    plugins: [mergeVirtualCharbiClientDts()],
    dts: true,
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
