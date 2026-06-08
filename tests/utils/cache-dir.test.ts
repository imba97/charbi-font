import path from 'node:path'
import { describe, expect, it } from 'vite-plus/test'
import { getSubsetCacheDir, getWordsCacheDir } from '../../src/utils/cache-dir'

const defaultFontsCache = '/proj/node_modules/@uiron/charbi/.cache/fonts'

describe('cache-dir', () => {
  it('getSubsetCacheDir and getWordsCacheDir sit under .cache root', () => {
    expect(getSubsetCacheDir(defaultFontsCache)).toBe(
      '/proj/node_modules/@uiron/charbi/.cache/subsets'
    )
    expect(getWordsCacheDir(defaultFontsCache)).toBe(
      '/proj/node_modules/@uiron/charbi/.cache/words'
    )
    expect(getSubsetCacheDir(path.join('/proj', '.cache', 'fonts'))).toBe(
      path.join('/proj', '.cache', 'subsets')
    )
    expect(getWordsCacheDir(path.join('/proj', '.cache', 'fonts'))).toBe(
      path.join('/proj', '.cache', 'words')
    )
  })
})
