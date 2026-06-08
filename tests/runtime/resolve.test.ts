import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import type { ResolvedConfig } from '../../src/config/schema'
import {
  buildFontFaces,
  loadCharbiConfig,
  resolveBuildFontVersion,
  resolveCharbiSnapshot,
  resolveFontAssetBase,
  resolveFontAssetBaseUrl,
  resolveFontFaces
} from '../../src/runtime'

vi.mock('../../src/config/loader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/config/loader')>()
  return {
    ...actual,
    loadConfig: vi.fn()
  }
})

import { loadConfig } from '../../src/config/loader'

const originalCwd = process.cwd()
const originalViteFontVersion = process.env.VITE_FONT_BUILD_VERSION

afterEach(() => {
  process.chdir(originalCwd)
  if (originalViteFontVersion === undefined) {
    delete process.env.VITE_FONT_BUILD_VERSION
  } else {
    process.env.VITE_FONT_BUILD_VERSION = originalViteFontVersion
  }
  vi.clearAllMocks()
})

function mockResolvedConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    scan: { srcDir: ['src'], extensions: ['vue'] },
    fonts: [
      {
        family: 'Alibaba PuHuiTi',
        name: 'Regular',
        weight: 400,
        url: 'https://example.com/font.ttf'
      },
      {
        family: 'DelaGothicOne',
        name: 'Regular',
        weight: 400,
        url: 'https://example.com/dela.ttf',
        format: 'ttf'
      }
    ],
    output: { format: 'woff2', cssDir: 'src/styles' },
    upload: { provider: 'cos', concurrency: 5 },
    cos: {
      cdnUrl: 'https://cdn.example.com',
      basePath: 'static/fonts/built/{version}'
    },
    root: process.cwd(),
    cacheDir: '/tmp/cache',
    version: undefined,
    env: {},
    mode: 'development',
    ...overrides
  }
}

describe('runtime', () => {
  it('resolveBuildFontVersion prefers VITE_FONT_BUILD_VERSION', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'charbi-runtime-'))
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'demo', version: '1.2.3' }),
      'utf-8'
    )
    process.chdir(tempDir)
    process.env.VITE_FONT_BUILD_VERSION = '9.9.9'

    expect(resolveBuildFontVersion(tempDir)).toBe('9.9.9')
  })

  it('resolveBuildFontVersion falls back to package.json version', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'charbi-runtime-'))
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'demo', version: '0.0.84' }),
      'utf-8'
    )

    expect(resolveBuildFontVersion(tempDir)).toBe('0.0.84')
  })

  it('buildFontFaces derives file names from config', () => {
    const config = mockResolvedConfig()
    const faces = buildFontFaces(config)

    expect(faces).toEqual([
      {
        family: 'Alibaba PuHuiTi',
        file: 'AlibabaPuHuiTi-400.woff2',
        weight: '400',
        style: 'normal',
        variant: 'normal'
      },
      {
        family: 'DelaGothicOne',
        file: 'DelaGothicOne-400.ttf',
        weight: '400',
        style: 'normal',
        variant: 'normal'
      }
    ])
  })

  it('resolveFontAssetBaseUrl substitutes version in basePath', () => {
    const config = mockResolvedConfig()
    expect(resolveFontAssetBaseUrl(config, '1.0.0')).toBe(
      'https://cdn.example.com/static/fonts/built/1.0.0'
    )
  })

  it('resolveFontAssetBaseUrl returns undefined when cos is incomplete', () => {
    const config = mockResolvedConfig({ cos: { cdnUrl: 'https://cdn.example.com' } })
    expect(resolveFontAssetBaseUrl(config, '1.0.0')).toBeUndefined()
  })

  it('resolveFontFaces loads config and returns faces', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'charbi-runtime-'))
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'demo', version: '0.0.84' }),
      'utf-8'
    )
    const config = mockResolvedConfig({ root: tempDir })
    ;(loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue(config)

    const faces = await resolveFontFaces({ root: tempDir, mode: 'development' })

    expect(faces).toHaveLength(2)
    expect(loadConfig).toHaveBeenCalledWith('development', tempDir)
  })

  it('resolveFontAssetBase returns CDN prefix with version', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'charbi-runtime-'))
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'demo', version: '0.0.84' }),
      'utf-8'
    )
    const config = mockResolvedConfig({ root: tempDir })
    ;(loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue(config)

    const base = await resolveFontAssetBase({ root: tempDir, mode: 'development' })

    expect(base).toBe('https://cdn.example.com/static/fonts/built/0.0.84')
  })

  it('resolveCharbiSnapshot prefers config.version over package.json', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'charbi-runtime-'))
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'demo', version: '0.0.84' }),
      'utf-8'
    )
    const config = mockResolvedConfig({ root: tempDir, version: '0.0.35' })
    ;(loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue(config)

    const snapshot = await resolveCharbiSnapshot({ root: tempDir, mode: 'development' })

    expect(snapshot.version).toBe('0.0.35')
    expect(snapshot.assetBase).toBe('https://cdn.example.com/static/fonts/built/0.0.35')
    expect(loadConfig).toHaveBeenCalledTimes(1)
  })

  it('resolveFontFaces and resolveFontAssetBase share one loadConfig via snapshot', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'charbi-runtime-'))
    const config = mockResolvedConfig({ root: tempDir })
    ;(loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue(config)

    await resolveFontFaces({ root: tempDir })
    await resolveFontAssetBase({ root: tempDir })

    expect(loadConfig).toHaveBeenCalledTimes(2)
  })

  it('loadCharbiConfig delegates to loadConfig', async () => {
    const config = mockResolvedConfig()
    ;(loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue(config)

    const loaded = await loadCharbiConfig({ mode: 'production' })

    expect(loaded).toBe(config)
    expect(loadConfig).toHaveBeenCalledWith('production', process.cwd())
  })
})
