import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { exportFontWordFiles } from '../../src/core/export-words'
import { DEFAULT_CHARS } from '../../src/utils/defaults'

describe('export-words', () => {
  let dir = ''

  afterEach(() => {
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true })
      dir = ''
    }
  })

  it('writes scan chars plus per-font extraText', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'charbi-words-'))
    const collected = {
      fromFiles: new Set(['你', '好']),
      all: new Set(['你', '好'])
    }
    const fonts = [
      { family: 'Alibaba PuHuiTi', name: 'Regular', weight: 400, url: 'x', extraText: '！' },
      { family: 'Alibaba PuHuiTi', name: 'Black', weight: 900, url: 'y' }
    ]

    await exportFontWordFiles(collected, fonts, dir)

    const regular = fs.readFileSync(path.join(dir, 'AlibabaPuHuiTi-400.txt'), 'utf-8')
    const black = fs.readFileSync(path.join(dir, 'AlibabaPuHuiTi-900.txt'), 'utf-8')

    expect(regular).toBe('你好！')
    expect(black).toBe('你好')
  })

  it('writes only DEFAULT_CHARS and extraText when scan is false', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'charbi-words-'))
    const collected = {
      fromFiles: new Set(['你', '好']),
      all: new Set(['你', '好'])
    }
    const fonts = [
      {
        family: 'LogoSC Unbounded Sans',
        name: 'Regular',
        weight: 400,
        url: 'x',
        extraText: '¥0123456789.',
        scan: false
      }
    ]

    await exportFontWordFiles(collected, fonts, dir)

    const words = fs.readFileSync(path.join(dir, 'LogoSCUnboundedSans-400.txt'), 'utf-8')

    expect(words).not.toContain('你')
    expect(words).not.toContain('好')
    expect(words).toContain('¥')
    for (const char of DEFAULT_CHARS) {
      expect(words).toContain(char)
    }
  })
})
