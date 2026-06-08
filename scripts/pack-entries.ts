/** vp pack 多入口：改此处即可，build 时 sync-package-exports 同步 package.json */
export const packEntries = {
  config: './src/config/index.ts',
  runtime: './src/runtime/index.ts',
  vite: './src/vite/index.ts',
  cli: './src/cli/index.ts',
  client: './src/client/index.ts'
} as const

export type PackEntryName = keyof typeof packEntries

export const packEntryNames = Object.keys(packEntries) as PackEntryName[]
