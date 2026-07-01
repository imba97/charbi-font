import { resolveCharbiSnapshot } from '../runtime'
import { serializeVirtualCharbiModule } from '../runtime/serialize-virtual-module'
import process from 'node:process'

/**
 * 跨 vite 5/6/7/8 兼容的 plugin shape（避免把 vite 拉成运行时依赖）。
 *
 * 历史实现用 `watchChange` 钩子：
 * - vite 5 不存在该 hook（静默忽略）
 * - vite 6+ 签名变了（`(id, change) => void | Promise<void>` + `this.environment.moduleGraph`）
 *   原代码读 `ctx.server.moduleGraph` 在 vite 6+ 是 `undefined`，整个钩子失效
 *
 * 改用 `configureServer` + `server.watcher.on('change', ...)`，3/4/5/6/7/8 全版本统一路径。
 */
export interface VitePluginLike {
  name: string
  resolveId?: (id: string) => string | null
  load?: (id: string) => string | null | Promise<string | null>
  configResolved?: (config: { root: string; mode: string }) => void
  /**
   * 参数用 `unknown` 是为了避免 contravariance 失败：
   * vite 5/6/7/8 在 `configureServer` 上各自的参数类型略有差异（ObjectHook / HookHandler 等），
   * 强类型声明 `ViteDevServerLike` 会与 vite 的 `ServerHook` 不兼容。
   * 内部用 `ViteDevServerLike` 做窄化强转。
   */
  configureServer?: (server: unknown) => void
}

/** vite dev server 子集；plugin 闭包需要 `watcher` + `moduleGraph` */
export interface ViteDevServerLike {
  watcher: { on: (event: 'change' | 'add' | 'unlink', cb: (file: string) => void) => void }
  moduleGraph: {
    getModuleById: (id: string) => unknown
    invalidateModule: (mod: unknown) => void
  }
}

const VIRTUAL_CHARBI_ID = '\0virtual:charbi'
const FONTS_CONFIG_RE = /fonts\.config\.(ts|mts|cts|js|mjs|cjs|json|json5)$/

export default function CharbiFont(): VitePluginLike {
  let viteRoot = process.cwd()
  let viteMode: 'development' | 'production' =
    process.env.NODE_ENV === 'production' ? 'production' : 'development'

  return {
    name: 'virtual-charbi',
    configResolved(config) {
      viteRoot = config.root
      viteMode = config.mode === 'production' ? 'production' : 'development'
    },
    resolveId(id: string) {
      if (id === 'virtual:charbi') return VIRTUAL_CHARBI_ID
      return null
    },
    async load(id: string) {
      if (id !== VIRTUAL_CHARBI_ID) return null

      const snapshot = await resolveCharbiSnapshot({
        root: viteRoot,
        mode: viteMode
      })

      return serializeVirtualCharbiModule(snapshot.faces, snapshot.version, snapshot.assetBase)
    },
    configureServer(server) {
      const devServer = server as ViteDevServerLike
      devServer.watcher.on('change', (file) => {
        if (!FONTS_CONFIG_RE.test(file)) return
        const mod = devServer.moduleGraph.getModuleById(VIRTUAL_CHARBI_ID)
        if (mod) devServer.moduleGraph.invalidateModule(mod)
      })
    }
  }
}
