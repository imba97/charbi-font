import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { resolveCharbiSnapshot } from "../../src/runtime";
import { serializeVirtualCharbiModule } from "../../src/runtime/serialize-virtual-module";

const fixtureRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/uiron-education-mp"
);

const FONT_UNO_KEY_BY_FAMILY: Record<string, string> = {
  DelaGothicOne: "dela",
  "Alibaba PuHuiTi": "puhui",
  "DingTalk JinBuTi": "jinbuti"
};

const EXPECTED_FACES = [
  {
    family: "Alibaba PuHuiTi",
    file: "AlibabaPuHuiTi-400.woff2",
    weight: "400",
    style: "normal",
    variant: "normal"
  },
  {
    family: "Alibaba PuHuiTi",
    file: "AlibabaPuHuiTi-500.woff2",
    weight: "500",
    style: "normal",
    variant: "normal"
  },
  {
    family: "Alibaba PuHuiTi",
    file: "AlibabaPuHuiTi-600.woff2",
    weight: "600",
    style: "normal",
    variant: "normal"
  },
  {
    family: "Alibaba PuHuiTi",
    file: "AlibabaPuHuiTi-700.woff2",
    weight: "700",
    style: "normal",
    variant: "normal"
  },
  {
    family: "Alibaba PuHuiTi",
    file: "AlibabaPuHuiTi-900.woff2",
    weight: "900",
    style: "normal",
    variant: "normal"
  },
  {
    family: "Alibaba PuHuiTi",
    file: "AlibabaPuHuiTi-1000.woff2",
    weight: "1000",
    style: "normal",
    variant: "normal"
  },
  {
    family: "DingTalk JinBuTi",
    file: "DingTalkJinBuTi-400.woff2",
    weight: "400",
    style: "normal",
    variant: "normal"
  },
  {
    family: "DelaGothicOne",
    file: "DelaGothicOne-400.ttf",
    weight: "400",
    style: "normal",
    variant: "normal"
  }
];

describe("golden: uiron-education-mp fixture", () => {
  it("resolveCharbiSnapshot matches expected faces and asset base", async () => {
    const snapshot = await resolveCharbiSnapshot({
      root: fixtureRoot,
      mode: "development"
    });

    expect(snapshot.version).toBe("0.0.84");
    expect(snapshot.faces).toEqual(EXPECTED_FACES);
    expect(snapshot.assetBase).toBe(
      "https://table-cos.xironiot.com/cos_coach/static/fonts/built/0.0.84"
    );
  });

  it("serializeVirtualCharbiModule output is stable", async () => {
    const snapshot = await resolveCharbiSnapshot({
      root: fixtureRoot,
      mode: "development"
    });

    expect(serializeVirtualCharbiModule(snapshot.faces, snapshot.version, snapshot.assetBase))
      .toMatchInlineSnapshot(`
        "export const FONT_BUILD_VERSION = "0.0.84";
        export const BUILD_FONT_FACES = [{"family":"Alibaba PuHuiTi","file":"AlibabaPuHuiTi-400.woff2","weight":"400","style":"normal","variant":"normal"},{"family":"Alibaba PuHuiTi","file":"AlibabaPuHuiTi-500.woff2","weight":"500","style":"normal","variant":"normal"},{"family":"Alibaba PuHuiTi","file":"AlibabaPuHuiTi-600.woff2","weight":"600","style":"normal","variant":"normal"},{"family":"Alibaba PuHuiTi","file":"AlibabaPuHuiTi-700.woff2","weight":"700","style":"normal","variant":"normal"},{"family":"Alibaba PuHuiTi","file":"AlibabaPuHuiTi-900.woff2","weight":"900","style":"normal","variant":"normal"},{"family":"Alibaba PuHuiTi","file":"AlibabaPuHuiTi-1000.woff2","weight":"1000","style":"normal","variant":"normal"},{"family":"DingTalk JinBuTi","file":"DingTalkJinBuTi-400.woff2","weight":"400","style":"normal","variant":"normal"},{"family":"DelaGothicOne","file":"DelaGothicOne-400.ttf","weight":"400","style":"normal","variant":"normal"}];
        export const FONT_ASSET_BASE_URL = "https://table-cos.xironiot.com/cos_coach/static/fonts/built/0.0.84";"
      `);
  });

  it("UnoCSS family rules derive 3 presets from snapshot faces", async () => {
    const { faces } = await resolveCharbiSnapshot({
      root: fixtureRoot,
      mode: "development"
    });

    const families = [...new Set(faces.map((face) => face.family))];
    const rules = families
      .map((family) => {
        const key = FONT_UNO_KEY_BY_FAMILY[family];
        return key ? [`font-${key}`, { "font-family": family }] : null;
      })
      .filter(Boolean);

    expect(rules).toEqual([
      ["font-puhui", { "font-family": "Alibaba PuHuiTi" }],
      ["font-jinbuti", { "font-family": "DingTalk JinBuTi" }],
      ["font-dela", { "font-family": "DelaGothicOne" }]
    ]);
  });
});
