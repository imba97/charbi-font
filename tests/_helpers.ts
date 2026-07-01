import type { ResolvedConfig } from '../src/config/schema'

export function mockResolvedConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
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
