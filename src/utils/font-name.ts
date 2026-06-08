export function normalizeFamilyForFileName(family: string): string {
  return family.replace(/\s+/g, '')
}

/** 字体 family → 样式文件名 slug（kebab-case，无空格） */
export function toFamilyStyleSlug(family: string): string {
  return family
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}
