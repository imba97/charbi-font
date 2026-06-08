import type { FontFaceDescriptor } from './types'

/** 生成 virtual:charbi 模块 ESM 源码 */
export function serializeVirtualCharbiModule(
  faces: readonly FontFaceDescriptor[],
  version: string,
  assetBase: string | undefined
): string {
  const lines = [
    `export const FONT_BUILD_VERSION = ${JSON.stringify(version)};`,
    `export const BUILD_FONT_FACES = ${JSON.stringify(faces)};`
  ]
  if (assetBase !== undefined) {
    lines.push(`export const FONT_ASSET_BASE_URL = ${JSON.stringify(assetBase)};`)
  } else {
    lines.push('export const FONT_ASSET_BASE_URL = undefined;')
  }
  return lines.join('\n')
}
