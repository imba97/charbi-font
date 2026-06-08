import { resolveCharbiSnapshot } from "../runtime";
import { serializeVirtualCharbiModule } from "../runtime/serialize-virtual-module";
import process from "node:process";

export interface VitePluginLike {
  name: string;
  resolveId?: (id: string) => string | null;
  load?: (id: string) => string | null | Promise<string | null>;
  configResolved?: (config: { root: string; mode: string }) => void;
  watchChange?: (
    file: string,
    ctx: {
      server?: {
        moduleGraph: {
          invalidateModule: (mod: unknown) => void;
          getModuleById: (id: string) => unknown;
        };
      };
    }
  ) => void;
}

const VIRTUAL_CHARBI_ID = "\0virtual:charbi";

export default function CharbiFont(): VitePluginLike {
  let viteRoot = process.cwd();
  let viteMode: "development" | "production" =
    process.env.NODE_ENV === "production" ? "production" : "development";

  return {
    name: "virtual-charbi",
    configResolved(config) {
      viteRoot = config.root;
      viteMode = config.mode === "production" ? "production" : "development";
    },
    resolveId(id: string) {
      if (id === "virtual:charbi") return VIRTUAL_CHARBI_ID;
      return null;
    },
    async load(id: string) {
      if (id !== VIRTUAL_CHARBI_ID) return null;

      const snapshot = await resolveCharbiSnapshot({
        root: viteRoot,
        mode: viteMode
      });

      return serializeVirtualCharbiModule(snapshot.faces, snapshot.version, snapshot.assetBase);
    },
    watchChange(file, ctx) {
      if (!/fonts\.config\.(ts|mts|cts|js|mjs|cjs|json|json5)$/.test(file)) {
        return;
      }
      const server = ctx.server;
      if (!server) return;
      const mod = server.moduleGraph.getModuleById(VIRTUAL_CHARBI_ID);
      if (mod) {
        server.moduleGraph.invalidateModule(mod);
      }
    }
  };
}
