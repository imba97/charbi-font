import fs from 'node:fs'
import path from 'node:path'
import type { PackEntryName } from '../../pack-entries.ts'

function buildExports(entryNames: readonly PackEntryName[]): Record<string, unknown> {
  const exports: Record<string, unknown> = {
    './package.json': './package.json'
  }

  for (const name of entryNames) {
    exports[`./${name}`] = {
      import: `./dist/${name}.mjs`,
      require: `./dist/${name}.cjs`,
      types: `./dist/${name}.d.mts`
    }
  }

  return exports
}

function buildTypesVersions(entryNames: readonly PackEntryName[]): Record<string, string[]> {
  const versions: Record<string, string[]> = {}
  for (const name of entryNames) {
    versions[name] = [`./dist/${name}.d.mts`]
  }
  return versions
}

function isSameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** 根据 pack.entry 同步 package.json 的 exports 与 typesVersions */
export default function syncPackageExports(entryNames: readonly PackEntryName[]): {
  name: string
  closeBundle(): void
} {
  return {
    name: 'sync-package-exports',
    closeBundle() {
      const pkgPath = path.resolve('package.json')
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
        exports?: Record<string, unknown>
        typesVersions?: { '*': Record<string, string[]> }
        [key: string]: unknown
      }

      const nextExports = buildExports(entryNames)
      const nextTypesVersions = { '*': buildTypesVersions(entryNames) }

      if (
        isSameJson(pkg.exports, nextExports) &&
        isSameJson(pkg.typesVersions, nextTypesVersions)
      ) {
        return
      }

      pkg.exports = nextExports
      pkg.typesVersions = nextTypesVersions
      fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
    }
  }
}
