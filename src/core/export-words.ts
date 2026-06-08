import type { FontConfig } from '../config/schema'
import fs from 'node:fs'
import path from 'node:path'
import consola from 'consola'
import { mergeChars } from '../utils/merge-chars'
import { subsetWordsFileName } from '../utils/subset-font-file'

function sortCharText(text: string): string {
  return Array.from(text)
    .sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)
    .join('')
}

/** 将扫描索引字符 + extraText 写入各字体对应的 words 清单（文件名与 subsets 一致） */
export async function exportFontWordFiles(
  chars: Set<string>,
  fonts: FontConfig[],
  wordsDir: string
): Promise<void> {
  fs.mkdirSync(wordsDir, { recursive: true })

  for (const entry of fs.readdirSync(wordsDir)) {
    fs.unlinkSync(path.join(wordsDir, entry))
  }

  consola.info('导出字符清单...')
  consola.info(`   输出目录: ${wordsDir}`)

  for (const font of fonts) {
    const charText = sortCharText(mergeChars(chars, font.extraText))
    const fileName = subsetWordsFileName(font)
    const outPath = path.join(wordsDir, fileName)

    fs.writeFileSync(outPath, charText, 'utf-8')
    consola.success(`     ${font.family} ${font.weight}: ${charText.length} 字 -> ${fileName}`)
  }
}
