import type { ExtraText } from '../config/schema'

function normalizeExtraText(extraText?: ExtraText): string[] {
  if (!extraText) {
    return []
  }

  return Array.isArray(extraText) ? extraText : [extraText]
}

/** 合并扫描字符与字体/扫描配置中的 extraText */
export function mergeChars(baseChars: Set<string>, extraText?: ExtraText): string {
  const mergedChars = new Set(baseChars)

  for (const text of normalizeExtraText(extraText)) {
    for (const char of text) {
      if (char.trim()) {
        mergedChars.add(char)
      }
    }
  }

  return Array.from(mergedChars).join('')
}
