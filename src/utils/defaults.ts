// 默认字符集 - 始终包含在字体子集中的基础字符
export const DEFAULT_CHARS =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ,.;:!?\'"，。；：！？'

/** Set 形式的 DEFAULT_CHARS，给 scan:false 复用，避免每个字体都重建 */
export const DEFAULT_CHARS_SET: ReadonlySet<string> = new Set(DEFAULT_CHARS)
