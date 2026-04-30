/**
 * 字体子集化构建工具配置类型定义
 */

// 字体格式
export type FontFormat = "woff" | "woff2" | "ttf";
export type ExtraText = string | string[];

// 字体配置
export interface FontConfig {
  // 字体显示名称
  name: string;
  // 字体系列名称（同 family 的会合并到一个 CSS 文件）
  family: string;
  // 字重
  weight: number;
  // 字体文件 URL（COS 地址）
  url: string;
  // 字体样式（normal/italic）
  style?: "normal" | "italic";
  // 字体输出格式（可选，不设置则使用全局配置）
  format?: FontFormat;
  // 仅对当前字体生效的额外文本
  extraText?: ExtraText;
}

// 扫描配置
export interface ScanConfig {
  // 扫描的源码目录
  srcDir: string[];
  // 扫描的文件扩展名
  extensions: string[];
  // 对所有字体生效的额外文本
  extraText?: ExtraText;
}

// COS 配置
export interface COSConfig {
  // Bucket 名称
  bucket?: string;
  // 所属地域
  region?: string;
  // 上传基础路径，支持 {version} 占位符
  basePath?: string;
  // CDN 地址，用于显示上传后的访问地址
  cdnUrl?: string;
  // 是否覆盖已存在文件
  overwrite?: boolean;
}

export type UploadProviderType = "cos";

export interface UploadConfig {
  provider?: UploadProviderType;
  concurrency?: number;
}

// 样式文件格式
export type StyleFormat = "scss" | "css";

/**
 * @font-face 的 font-display（与 CSS Fonts 一致）
 * - 设为 `false`：不在生成的 CSS 中输出 `font-display`（浏览器默认 auto）
 * - 不设：与 `false` 相同（默认不再使用历史上的 `swap`，避免明显 FOUT）
 */
export type FontFaceDisplay = "auto" | "block" | "swap" | "fallback" | "optional";

// 输出配置
export interface OutputConfig {
  // CSS 输出目录（相对于项目根目录，如 'src/styles'）
  cssDir: string;
  // 字体文件格式（用于子集化，可被单个字体的 format 覆盖）
  format: FontFormat;
  // 样式文件格式（scss 或 css），可选，默认 css
  styleFormat?: StyleFormat;
  /**
   * 生成的 @font-face 是否包含 font-display
   * - 默认：不写该行（等价于浏览器 auto）
   * - 需要与旧版一致的可显式设为 `'swap'`
   */
  fontDisplay?: FontFaceDisplay | false;
}

// 环境变量配置
export interface EnvConfig {
  development?: string;
  production?: string;
}

// 构建配置
export interface BuildConfig {
  // 扫描配置
  scan: ScanConfig;
  // 字体配置
  fonts: FontConfig[];
  // 输出配置
  output: OutputConfig;
  // 版本号（可选，为空时从 package.json 读取）
  version?: string;
  // 环境变量文件配置
  env?: EnvConfig;
  // 缓存目录（可选，默认为 node_modules/charbi-font/.cache/fonts）
  cacheDir?: string;
}

// 主配置
export interface UserConfig {
  // 构建配置
  build?: Partial<BuildConfig>;
  // 上传配置（用于选择上传器，默认 cos）
  upload?: UploadConfig;
  // COS 上传配置（provider=cos 时使用）
  cos?: COSConfig;
}

// 内部完整配置（包含默认值）
export interface ResolvedConfig extends Required<Omit<BuildConfig, "version" | "env">> {
  // 上传配置
  upload: UploadConfig;
  // COS 配置（上传时交互式获取）
  cos: COSConfig;
  // 项目根目录
  root: string;
  // 缓存目录
  cacheDir: string;
  // 版本号（可选）
  version?: string;
  // 环境变量配置
  env: EnvConfig;
  // 当前模式
  mode: "development" | "production";
}

// 默认配置
export const defaultConfig: Omit<BuildConfig, "version"> = {
  scan: {
    srcDir: ["src"],
    extensions: ["vue", "ts", "tsx", "js", "jsx", "scss", "css"],
    extraText: ""
  },
  fonts: [],
  output: {
    cssDir: "src/styles",
    format: "woff",
    styleFormat: "css"
  }
};

// 字体资源子目录名称（固定）
export const FONT_ASSETS_DIR = "font-assets";

// 定义配置函数
export function defineConfig(config: UserConfig): UserConfig {
  return config;
}
