import { describe, expect, it, vi } from "vite-plus/test";
import CharbiFont from "../../src/vite/index";
import { serializeVirtualCharbiModule } from "../../src/runtime/serialize-virtual-module";

vi.mock("../../src/runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/runtime")>();
  return {
    ...actual,
    resolveCharbiSnapshot: vi.fn()
  };
});

import { resolveCharbiSnapshot } from "../../src/runtime";

describe("vite virtual module", () => {
  it("load hook exposes virtual:charbi via resolveCharbiSnapshot", async () => {
    const faces = [
      {
        family: "Alibaba PuHuiTi",
        file: "AlibabaPuHuiTi-400.woff2",
        weight: "400",
        style: "normal" as const,
        variant: "normal" as const
      }
    ];

    (resolveCharbiSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: "0.0.84",
      faces,
      assetBase: "https://cdn.example.com/static/fonts/built/0.0.84"
    });

    const plugin = CharbiFont();
    expect(plugin.resolveId?.("virtual:charbi")).toBe("\0virtual:charbi");

    const source = await plugin.load?.("\0virtual:charbi");
    expect(source).toBe(
      serializeVirtualCharbiModule(
        faces,
        "0.0.84",
        "https://cdn.example.com/static/fonts/built/0.0.84"
      )
    );
    expect(resolveCharbiSnapshot).toHaveBeenCalledTimes(1);
  });
});
