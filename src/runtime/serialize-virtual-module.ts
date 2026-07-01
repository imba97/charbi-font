import type { FontFaceDescriptor } from './types'

/** 生成 virtual:charbi 模块 ESM 源码 */
export function serializeVirtualCharbiModule(
  faces: readonly FontFaceDescriptor[],
  version: string,
  assetBase: string | undefined
): string {
  const assetBaseLiteral = assetBase !== undefined ? JSON.stringify(assetBase) : 'undefined'
  return [
    `export const FONT_BUILD_VERSION = ${JSON.stringify(version)};`,
    `export const BUILD_FONT_FACES = ${JSON.stringify(faces)};`,
    `export const FONT_ASSET_BASE_URL = ${assetBaseLiteral};`
  ].join('\n')
}
