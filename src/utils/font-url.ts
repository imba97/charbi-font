import type { FontConfig, ResolvedConfig } from '../config/schema'
import { subsetOutputFileName } from './subset-font-file'

/** CDN 资源前缀（不含文件名） */
export function resolveFontAssetBaseUrl(
  config: ResolvedConfig,
  version: string
): string | undefined {
  const { cdnUrl, basePath } = config.cos
  if (!cdnUrl || !basePath) {
    return undefined
  }
  const cleanCdn = cdnUrl.replace(/\/+$/, '')
  const cleanPath = basePath.replace('{version}', version).replace(/^\/+|\/+$/g, '')
  return `${cleanCdn}/${cleanPath}`
}

/** 单个字体文件的 CDN 或本地 URL */
export function resolveFontFileUrl(
  config: ResolvedConfig,
  font: FontConfig,
  version: string,
  extension: string
): string {
  const { cos } = config
  if (cos.cdnUrl) {
    if (!cos.basePath) {
      throw new Error('COS 配置缺少 basePath，请在 fonts.config.ts 中设置 cos.basePath')
    }
    const filename = subsetOutputFileName(font, extension)
    const baseUrl = resolveFontAssetBaseUrl(config, version)
    return `${baseUrl}/${filename}`
  }
  return `./fonts/${subsetOutputFileName(font, extension)}`
}
