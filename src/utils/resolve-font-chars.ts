import type { FontConfig } from '../config/schema'
import type { CollectedChars } from '../core/scan'
import consola from 'consola'
import { DEFAULT_CHARS_SET } from './defaults'
import { mergeChars } from './merge-chars'

/** 按字体配置解析子集字符：scan:false 时仅 DEFAULT_CHARS + extraText */
export function resolveFontChars(font: FontConfig, collected: CollectedChars): string {
  if (font.scan === false) {
    if (!font.extraText) {
      consola.warn(
        `   ${font.family} ${font.name}: scan 已关闭且未配置 extraText，子集仅含 DEFAULT_CHARS`
      )
    }

    return mergeChars(DEFAULT_CHARS_SET as Set<string>, font.extraText)
  }

  return mergeChars(collected.all, font.extraText)
}
