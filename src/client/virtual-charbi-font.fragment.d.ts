/** 打包后追加进 client.d.ts；字段需与 ./types.ts 的 CharbiFontFaceDescriptor 保持一致 */
declare module "virtual:charbi-font" {
  export interface CharbiFontFaceDescriptor {
    readonly family: string;
    readonly file: string;
    readonly weight: string;
    readonly style: "normal" | "italic";
    readonly variant: "normal";
  }
  export const FONT_BUILD_VERSION: string;
  export const BUILD_FONT_FACES: readonly CharbiFontFaceDescriptor[];
  /** 已配置 cos.cdnUrl + cos.basePath（`{version}` 已替换）时的 CDN 前缀 */
  export const FONT_ASSET_BASE_URL: string | undefined;
}
