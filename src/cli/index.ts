import { CAC } from 'cac'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { downloadFonts } from '../core/download'
import { exportFontWordFiles } from '../core/export-words'
import { generateFontCss } from '../core/generate-css'
import { collectChars } from '../core/scan'
import { generateFontSubset } from '../core/subset'
import { getSubsetCacheDir, getWordsCacheDir } from '../utils/cache-dir'
import { uploadToCDN } from '../uploader'
import { getVersion, loadConfig } from '../config'
import { resolveConfiguredSubsetPaths } from '../utils/subset-font-file'
import consola from 'consola'

interface BuildOptions {
  cache?: boolean
}

interface GlobalOptions {
  mode?: 'development' | 'production'
}

const __dirname = path.dirname(
  (() => {
    try {
      return fs.realpathSync(fileURLToPath(import.meta.url))
    } catch {
      return fileURLToPath(import.meta.url)
    }
  })()
)
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))

const cli = new CAC('charbi')

cli.version(pkg.version)
cli.option('--mode <mode>', 'development 或 production')

// 默认命令：build + upload
cli.command('').action(runAll)

// build 命令：只打包
cli.command('build').option('--no-cache', '强制重新下载字体文件').action(runBuild)

// upload 命令：只上传
cli.command('upload').action(runUpload)

async function runAll(_options: unknown, globalOptions?: GlobalOptions) {
  await runBuild({ cache: true } as BuildOptions, globalOptions)
  await runUpload(undefined, globalOptions)
}

async function runBuild(options: BuildOptions, globalOptions?: GlobalOptions) {
  const mode = globalOptions?.mode || 'development'
  const config = await loadConfig(mode)
  const baseVersion = getVersion(config.version)

  consola.info('charbi')
  consola.info(`   模式: ${mode}`)
  consola.info(`   版本基线: ${baseVersion}`)
  consola.info(`   格式: ${config.output.format}`)

  const subsetCacheDir = getSubsetCacheDir(config.cacheDir)
  fs.mkdirSync(subsetCacheDir, { recursive: true })
  // 清空旧文件
  for (const entry of fs.readdirSync(subsetCacheDir)) {
    fs.unlinkSync(path.join(subsetCacheDir, entry))
  }

  const fontPathMap = await downloadFonts(config.cacheDir, config.fonts, !options.cache)

  if (fontPathMap.size === 0) {
    consola.error('没有可用的字体文件，构建失败')
    process.exit(1)
  }

  const collected = await collectChars(config)

  const wordsCacheDir = getWordsCacheDir(config.cacheDir)
  await exportFontWordFiles(collected, config.fonts, wordsCacheDir)

  const fontGroupMap = await generateFontSubset(
    fontPathMap,
    subsetCacheDir,
    collected,
    config.fonts,
    config.output.format
  )

  let totalFontSize = 0
  let fontCount = 0
  for (const subsets of fontGroupMap.values()) {
    for (const subset of subsets) {
      totalFontSize += subset.size
      fontCount++
    }
  }
  const totalFontSizeKB = (totalFontSize / 1024).toFixed(2)

  consola.success('字体子集生成完成!')
  consola.info(`   生成文件: ${fontCount} 个`)
  consola.info(`   总大小: ${totalFontSizeKB} KB`)
  consola.info(`   输出目录: ${subsetCacheDir}`)

  const versionStr = baseVersion
  consola.info(`   字体版本: ${versionStr}`)

  await generateFontCss(fontGroupMap, config, versionStr, config.output.format)
}

async function runUpload(_options: unknown, globalOptions?: GlobalOptions) {
  const mode = globalOptions?.mode || 'development'
  const config = await loadConfig(mode)
  const baseVersion = getVersion(config.version)
  const versionStr = baseVersion

  consola.info('charbi upload')
  consola.info(`   模式: ${mode}`)
  consola.info(`   版本: ${versionStr}`)

  const subsetCacheDir = getSubsetCacheDir(config.cacheDir)

  if (!fs.existsSync(subsetCacheDir)) {
    consola.error(`没有找到字体文件目录: ${subsetCacheDir}`)
    consola.error('请先执行 build 命令')
    process.exit(1)
  }

  const configuredPaths = resolveConfiguredSubsetPaths(
    config.fonts,
    config.output.format,
    subsetCacheDir
  )
  const fontFiles: string[] = []
  const missingNames: string[] = []
  for (const filePath of configuredPaths) {
    const name = path.basename(filePath)
    const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null
    if (stat?.isFile() && stat.size > 0) {
      fontFiles.push(filePath)
    } else {
      missingNames.push(name)
    }
  }

  if (missingNames.length > 0) {
    consola.warn(`   配置中的字体文件缺失: ${missingNames.join(', ')}`)
  }

  if (fontFiles.length === 0) {
    consola.error('没有找到可上传的字体文件，请先执行 build')
    process.exit(1)
  }

  await uploadToCDN(fontFiles, versionStr, config)
}

cli.help()
cli.parse()
