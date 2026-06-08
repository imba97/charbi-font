import { defineConfig } from 'vite-plus'
import { packEntries, packEntryNames } from './scripts/pack-entries.ts'
import mergeVirtualCharbiClientDts from './scripts/vite-plugins/merge-virtual-charbi-client-dts/index.ts'
import syncPackageExports from './scripts/vite-plugins/sync-package-exports/index.ts'

export default defineConfig({
  staged: {
    '*.{js,ts,tsx,vue,svelte}': 'vp check --fix'
  },
  pack: {
    entry: packEntries,
    plugins: [mergeVirtualCharbiClientDts(), syncPackageExports(packEntryNames)],
    dts: true,
    format: ['esm', 'cjs'],
    minify: true,
    deps: {
      neverBundle: [
        'cac',
        'consola',
        'defu',
        'enquirer',
        'fontmin',
        'p-limit',
        'tinyglobby',
        'unconfig'
      ]
    }
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true
    }
  },
  fmt: {
    singleQuote: true,
    semi: false,
    trailingComma: 'none'
  }
})
