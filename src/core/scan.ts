import type { ResolvedConfig } from '../config/schema'
import fs from 'node:fs'
import path from 'node:path'
import consola from 'consola'
import pLimit from 'p-limit'
import { glob } from 'tinyglobby'
import { addExtraTextToSet } from '../utils/merge-chars'
import { DEFAULT_CHARS } from '../utils/defaults'
import { stripComments } from './strip-comments'

/** 文件 IO 并发上限：避免一次性打开过多 fd */
const SCAN_FILE_CONCURRENCY = 16

// 从文本中提取字符
function extractCharsFromText(text: string, charSet: Set<string>): void {
  // 提取中文字符
  const chinese = text.match(/[\u4E00-\u9FA5]/g) || []
  chinese.forEach((c) => charSet.add(c))

  // 提取数字
  const numbers = text.match(/\d/g) || []
  numbers.forEach((c) => charSet.add(c))

  // 提取英文字母
  const letters = text.match(/[a-z]/gi) || []
  letters.forEach((c) => charSet.add(c))

  // 提取常用符号
  const symbols =
    text.match(/[·.,;:!?@#$%^&*()_+\-=[\]{}|\\/"'<>，。；：！？、【】《》「」『』（）]/g) || []
  symbols.forEach((c) => charSet.add(c))
}

export interface CollectedChars {
  /** 源码扫描字符（不含 scan.extraText、DEFAULT_CHARS） */
  fromFiles: Set<string>
  /** 完整全局集（= fromFiles + scan.extraText + DEFAULT_CHARS） */
  all: Set<string>
}

// 收集使用的字符
export async function collectChars(config: ResolvedConfig): Promise<CollectedChars> {
  consola.info('扫描项目文件...')

  const patterns = config.scan.srcDir.flatMap((dir) =>
    config.scan.extensions.map((ext) => `${dir}/**/*.${ext}`)
  )

  const files = await glob(patterns, {
    cwd: config.root,
    absolute: false,
    onlyFiles: true
  })

  consola.info(`   找到 ${files.length} 个文件`)

  const fromFiles = new Set<string>()
  const limit = pLimit(SCAN_FILE_CONCURRENCY)

  await Promise.all(
    files.map((file) =>
      limit(async () => {
        const content = await fs.promises.readFile(path.join(config.root, file), 'utf-8')
        const ext = file.split('.').pop() || ''

        // 移除注释后再提取字符
        const strippedContent = stripComments(content, ext)
        extractCharsFromText(strippedContent, fromFiles)
      })
    )
  )

  const all = new Set(fromFiles)
  addExtraTextToSet(all, config.scan.extraText)
  consola.info(`   收集到 ${all.size} 个唯一字符`)

  // 添加默认字符集
  for (const char of DEFAULT_CHARS) {
    all.add(char)
  }
  consola.info(`   添加默认字符集后共 ${all.size} 个字符`)

  return { fromFiles, all }
}
