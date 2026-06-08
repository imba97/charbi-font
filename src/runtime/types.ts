/** 与 buildFontFaces / resolveFontFaces 返回项一致 */
export interface FontFaceDescriptor {
  readonly family: string
  readonly file: string
  readonly weight: string
  readonly style: 'normal' | 'italic'
  readonly variant: 'normal'
}
