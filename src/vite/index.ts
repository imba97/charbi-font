import { resolveCharbiRuntime, serializeCharbiRuntimeAsEsm } from "../runtime";
import process from "node:process";

export interface VitePluginLike {
  name: string;
  resolveId?: (id: string) => string | null;
  load?: (id: string) => string | null | Promise<string | null>;
  configResolved?: (config: { root: string }) => void;
}

export default function CharbiFont(): VitePluginLike {
  let viteRoot = process.cwd();

  return {
    name: "virtual-charbi",
    configResolved(config) {
      viteRoot = config.root;
    },
    resolveId(id: string) {
      if (id === "virtual:charbi") return "\0virtual:charbi";
      return null;
    },
    async load(id: string) {
      if (id !== "\0virtual:charbi") return null;

      const mode = process.env.NODE_ENV === "production" ? "production" : "development";
      const runtime = await resolveCharbiRuntime({ root: viteRoot, mode });
      return serializeCharbiRuntimeAsEsm(runtime);
    }
  };
}
