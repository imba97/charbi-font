import type { FontFaceDescriptor } from './types'
import type { ResolvedConfig } from '../config/schema'
import { getVersion } from '../config/version'
import { loadConfig } from '../config'
import { resolveFontAssetBaseUrl } from '../utils/font-url'
import { subsetOutputFileName } from '../utils/subset-font-file'
import process from 'node:process'

export type { FontFaceDescriptor } from './types'
export { resolveBuildFontVersion, getVersion } from '../config/version'
export { resolveFontAssetBaseUrl, resolveFontFileUrl } from '../utils/font-url'

export interface CharbiResolveOptions {
  /** 项目根目录，默认 process.cwd() */
  root?: string
  mode?: 'development' | 'production'
}

export interface CharbiSnapshot {
  version: string
  faces: FontFaceDescriptor[]
  assetBase: string | undefined
}

function resolveOptions(options: CharbiResolveOptions = {}): {
  root: string
  mode: 'development' | 'production'
} {
  return {
    root: options.root ?? process.cwd(),
    mode: options.mode ?? (process.env.NODE_ENV === 'production' ? 'production' : 'development')
  }
}

/** 加载 fonts.config.ts 并 merge 默认值 */
export async function loadCharbiConfig(
  options: CharbiResolveOptions = {}
): Promise<ResolvedConfig> {
  const { root, mode } = resolveOptions(options)
  return loadConfig(mode, root)
}

/** 由 ResolvedConfig 推导字体 face 列表 */
export function buildFontFaces(config: ResolvedConfig): FontFaceDescriptor[] {
  return config.fonts.map((font) => ({
    family: font.family,
    file: subsetOutputFileName(font, font.format ?? config.output.format),
    weight: String(font.weight),
    style: font.style ?? 'normal',
    variant: 'normal' as const
  }))
}

/** 单次加载配置，返回 version / faces / assetBase */
export async function resolveCharbiSnapshot(
  options: CharbiResolveOptions = {}
): Promise<CharbiSnapshot> {
  const { root, mode } = resolveOptions(options)
  const config = await loadConfig(mode, root)
  const version = getVersion(config.version, root)
  return {
    version,
    faces: buildFontFaces(config),
    assetBase: resolveFontAssetBaseUrl(config, version)
  }
}

/** 加载配置并返回 face 列表 */
export async function resolveFontFaces(
  options: CharbiResolveOptions = {}
): Promise<FontFaceDescriptor[]> {
  return (await resolveCharbiSnapshot(options)).faces
}

/** 加载配置并返回 CDN 前缀 */
export async function resolveFontAssetBase(
  options: CharbiResolveOptions = {}
): Promise<string | undefined> {
  return (await resolveCharbiSnapshot(options)).assetBase
}
