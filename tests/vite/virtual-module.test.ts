import { describe, expect, it, vi } from "vite-plus/test";
import CharbiFont from "../../src/vite/index";
import { resolveCharbiRuntime, serializeCharbiRuntimeAsEsm } from "../../src/runtime";

vi.mock("../../src/runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/runtime")>();
  return {
    ...actual,
    resolveCharbiRuntime: vi.fn()
  };
});

describe("vite virtual module", () => {
  it("load hook returns same exports as resolveCharbiRuntime", async () => {
    const runtime = {
      FONT_BUILD_VERSION: "0.0.84",
      BUILD_FONT_FACES: [
        {
          family: "Alibaba PuHuiTi",
          file: "AlibabaPuHuiTi-400.woff2",
          weight: "400",
          style: "normal" as const,
          variant: "normal" as const
        }
      ],
      FONT_ASSET_BASE_URL: "https://cdn.example.com/static/fonts/built/0.0.84"
    };

    (resolveCharbiRuntime as ReturnType<typeof vi.fn>).mockResolvedValue(runtime);

    const plugin = CharbiFont();
    expect(plugin.resolveId?.("virtual:charbi")).toBe("\0virtual:charbi");
    expect(plugin.resolveId?.("other")).toBeNull();

    const source = await plugin.load?.("\0virtual:charbi");
    expect(source).toBe(serializeCharbiRuntimeAsEsm(runtime));
    expect(resolveCharbiRuntime).toHaveBeenCalled();
  });
});
