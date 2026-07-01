import type { ExtraText } from '../config/schema'

export function normalizeExtraText(extraText?: ExtraText): string[] {
  if (!extraText) {
    return []
  }

  return Array.isArray(extraText) ? extraText : [extraText]
}

/** 原地向 Set 追加 extraText 中的非空白字符（scan / resolveFontChars 共用） */
export function addExtraTextToSet(set: Set<string>, extraText?: ExtraText): void {
  for (const text of normalizeExtraText(extraText)) {
    for (const char of text) {
      if (char.trim()) {
        set.add(char)
      }
    }
  }
}

/** 合并扫描字符与字体/扫描配置中的 extraText */
export function mergeChars(baseChars: Set<string>, extraText?: ExtraText): string {
  const mergedChars = new Set(baseChars)
  addExtraTextToSet(mergedChars, extraText)
  return Array.from(mergedChars).join('')
}
