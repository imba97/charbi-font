import { describe, expect, it } from 'vite-plus/test'
import type { CollectedChars } from '../../src/core/scan'
import { DEFAULT_CHARS } from '../../src/utils/defaults'
import { resolveFontChars } from '../../src/utils/resolve-font-chars'

describe('resolveFontChars', () => {
  const collected: CollectedChars = {
    fromFiles: new Set(['你', '好']),
    all: new Set(['你', '好', '0'])
  }

  it('merges global scan chars when scan is enabled', () => {
    const font = {
      family: 'Test',
      name: 'Regular',
      weight: 400,
      url: 'x',
      extraText: '！'
    }

    const result = resolveFontChars(font, collected)

    expect(result).toContain('你')
    expect(result).toContain('好')
    expect(result).toContain('！')
    expect(result).toContain('0')
    expect(result.length).toBe(4)
  })

  it('uses only DEFAULT_CHARS and extraText when scan is false', () => {
    const font = {
      family: 'Test',
      name: 'Regular',
      weight: 400,
      url: 'x',
      extraText: '！',
      scan: false
    }

    const result = resolveFontChars(font, collected)

    expect(result).not.toContain('你')
    expect(result).not.toContain('好')
    expect(result).toContain('！')
    expect(result).toContain('0')
    for (const char of DEFAULT_CHARS) {
      expect(result).toContain(char)
    }
  })
})
