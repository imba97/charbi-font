/** 与 `BUILD_FONT_FACES` 单项一致，供 `uni.loadFontFace` 的 `family` / `desc` 与 CDN `file` 使用 */
export interface CharbiFontFaceDescriptor {
  readonly family: string;
  readonly file: string;
  readonly weight: string;
  readonly style: "normal" | "italic";
  readonly variant: "normal";
}
