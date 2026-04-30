import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite-plus";

/** 将虚拟模块 ambient 追加进 client 的 d.ts（*.ts 里 declare virtual: 会 TS2664，故用片段 + 打包后合并） */
function mergeVirtualCharbiFontClientDts(): {
  name: string;
  closeBundle(): void;
} {
  return {
    name: "merge-virtual-charbi-font-client-dts",
    closeBundle() {
      const fragment = path.resolve("src/client/virtual-charbi-font.fragment.d.ts");
      if (!fs.existsSync(fragment)) return;
      const text = fs.readFileSync(fragment, "utf8");
      for (const name of ["client.d.mts", "client.d.cts"] as const) {
        const file = path.resolve("dist", name);
        if (!fs.existsSync(file)) continue;
        const cur = fs.readFileSync(file, "utf8");
        if (cur.includes("virtual:charbi-font")) continue;
        fs.appendFileSync(file, `\n${text}`);
      }
    }
  };
}

export default defineConfig({
  staged: {
    "src/**/*.{ts,js,mjs,cjs}": "vp check --fix",
    "vite.config.ts": "vp check --fix",
    "package.json": "vp check --fix",
    "README.md": "vp check --fix"
  },
  pack: {
    entry: {
      config: "./src/config/index.ts",
      loader: "./src/config/loader.ts",
      vite: "./src/vite/index.ts",
      cli: "./src/cli/index.ts",
      client: "./src/client/index.ts"
    },
    plugins: [mergeVirtualCharbiFontClientDts()],
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
