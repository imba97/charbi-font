import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vite-plus/test'
import {
  resolveConfiguredSubsetPaths,
  subsetOutputFileName,
  subsetWordsFileName
} from '../../src/utils/subset-font-file'

describe('subset-font-file', () => {
  it('subsetOutputFileName removes spaces from family', () => {
    expect(
      subsetOutputFileName(
        { family: 'Alibaba PuHuiTi', name: 'Regular', weight: 400, url: 'x' },
        'woff2'
      )
    ).toBe('AlibabaPuHuiTi-400.woff2')
  })

  it('subsetWordsFileName matches subset base name', () => {
    const font = { family: 'Alibaba PuHuiTi', name: 'Black', weight: 900, url: 'x' }
    expect(subsetWordsFileName(font)).toBe('AlibabaPuHuiTi-900.txt')
    expect(subsetOutputFileName(font, 'woff2')).toBe('AlibabaPuHuiTi-900.woff2')
  })

  it('resolveConfiguredSubsetPaths only maps configured fonts', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'charbi-subset-'))
    const fonts = [
      { family: 'Alibaba PuHuiTi', name: 'Regular', weight: 400, url: 'x' },
      { family: 'DelaGothicOne', name: 'Regular', weight: 400, url: 'y' }
    ]
    const paths = resolveConfiguredSubsetPaths(fonts, 'woff2', dir)
    expect(paths).toHaveLength(2)
    expect(paths[0]).toBe(path.join(dir, 'AlibabaPuHuiTi-400.woff2'))
    expect(paths[1]).toBe(path.join(dir, 'DelaGothicOne-400.woff2'))
    fs.rmSync(dir, { recursive: true })
  })
})
