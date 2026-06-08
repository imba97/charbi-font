declare module 'virtual:charbi' {
  export interface FontFaceDescriptor {
    readonly family: string
    readonly file: string
    readonly weight: string
    readonly style: 'normal' | 'italic'
    readonly variant: 'normal'
  }
  export const FONT_BUILD_VERSION: string
  export const BUILD_FONT_FACES: readonly FontFaceDescriptor[]
  export const FONT_ASSET_BASE_URL: string | undefined
}
