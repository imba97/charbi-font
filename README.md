# charbi-font

中文字体子集化工具，扫描代码提取字符，生成精简字体包。

## 特性

- ✂️ **字体子集化** — 仅包含代码中实际使用的字符
- 📁 **代码扫描** — 递归扫描源码文件，提取字符使用情况
- 📦 **多字重合并** — 同一字体的多个字重合并到一个文件
- ☁️ **CDN 上传** — 可上传到 CDN（如腾讯云 COS）
- ⚡ **本地缓存** — 字体文件本地缓存，避免重复下载

## 安装

```bash
npm install charbi-font
# 或
pnpm add charbi-font
```

如需 CDN 上传功能，需安装 `cos-nodejs-sdk-v5`：

```bash
npm install cos-nodejs-sdk-v5
# 或
pnpm add cos-nodejs-sdk-v5
```

## 快速开始

### 1. 创建配置文件

在项目根目录创建 `fonts.config.ts`：

```typescript
import { defineConfig } from "charbi-font/config";

export default defineConfig({
  build: {
    scan: {
      srcDir: ["src"],
      extensions: ["vue", "ts", "js", "scss", "css"]
    },
    fonts: [
      {
        family: "AlibabaPuHuiTi",
        name: "Regular",
        weight: 400,
        url: "https://your-cos.com/path/to/AlibabaPuHuiTi-3.ttf"
      },
      {
        family: "AlibabaPuHuiTi",
        name: "Bold",
        weight: 700,
        url: "https://your-cos.com/path/to/AlibabaPuHuiTi-3-bold.ttf"
      }
    ],
    output: {
      cssDir: "src/styles",
      format: "woff"
      // styleFormat 可选，默认 "css"，如需可传 "scss"
      // styleFormat: "scss"
    }
  },
  cos: {
    bucket: "your-bucket",
    region: "ap-guangzhou",
    basePath: "static/fonts/{version}",
    cdnUrl: "https://your-cos.com"
  }
});
```

### 2. 执行构建和上传

```bash
charbi          # 构建 + 上传
charbi build    # 仅构建（生成字体子集）
charbi upload   # 仅上传（上传已构建的字体）
```

### 3. 引入字体

```typescript
// main.ts 或 App.vue
import "@/styles/fonts";
```

```css
.my-text {
  font-family: "AlibabaPuHuiTi", sans-serif;
  font-weight: 400;
}
```

## 构建流程

```
1. 下载字体   → 从 COS 下载字体源文件并缓存
2. 扫描代码   → 递归扫描 src/ 目录
3. 提取字符   → 提取中文、英文、数字、常用符号
4. 生成子集   → 使用 fontmin 压缩并转换为 WOFF
5. 生成 CSS  → 输出 font-*.css/scss 和 fonts.css/scss
```

## 输出结构

```
项目目录/
├── src/styles/
│   ├── font-assets/
│   │   ├── alibaba-pu-hui-ti.css    # 阿里普惠体（多字重，默认 css）
│   │   └── fonts.css                # 汇总引入文件
│   └── fonts.css                   # 入口文件
│
└── node_modules/charbi-font/.cache/fonts/  # 字体缓存
    ├── subsets/                     # 字体子集（构建产物）
    └── AlibabaPuHuiTi-400.ttf       # 原始字体缓存
```

## 配置说明

### `build.scan`

| 配置项       | 类型                 | 默认值    | 说明                       |
| ------------ | -------------------- | --------- | -------------------------- |
| `srcDir`     | `string[]`           | `['src']` | 扫描的目录                 |
| `extensions` | `string[]`           | 上方列表  | 扫描的文件类型             |
| `extraText`  | `string \| string[]` | —         | 额外包含的字符（所有字体） |

### `build.fonts[]`

| 配置项      | 类型                         | 必填 | 说明                         |
| ----------- | ---------------------------- | ---- | ---------------------------- |
| `family`    | `string`                     | 是   | 字体系列名（用于分组）       |
| `name`      | `string`                     | 是   | 显示名称                     |
| `weight`    | `number`                     | 是   | 字重                         |
| `url`       | `string`                     | 是   | 字体源地址                   |
| `style`     | `'normal' \| 'italic'`       | 否   | 字体样式                     |
| `format`    | `'woff' \| 'woff2' \| 'ttf'` | 否   | 覆盖全局格式                 |
| `extraText` | `string \| string[]`         | 否   | 额外包含的字符（仅当前字体） |

### `build.output`

| 配置项        | 类型                                                               | 默认值              | 说明                                                     |
| ------------- | ------------------------------------------------------------------ | ------------------- | -------------------------------------------------------- |
| `cssDir`      | `string`                                                           | `'src/styles'`      | CSS 输出目录                                             |
| `format`      | `'woff' \| 'woff2' \| 'ttf'`                                       | `'woff'`            | 输出格式                                                 |
| `styleFormat` | `'scss' \| 'css'`                                                  | `'css'`             | 样式文件格式（可选）                                     |
| `fontDisplay` | `'auto' \| 'block' \| 'swap' \| 'fallback' \| 'optional' \| false` | 不写 `font-display` | 默认不写该行（浏览器按 `auto`）；需要旧行为可设 `'swap'` |

### `build.cacheDir`

自定义缓存目录（默认：`node_modules/charbi-font/.cache/fonts`）：

```typescript
export default defineConfig({
  build: {
    cacheDir: ".cache/fonts" // 相对于项目根目录
  }
});
```

## 生成结果

默认生成的 `@font-face` **不包含** `font-display`（避免默认 `swap` 带来的明显 FOUT）。可在 `build.output.fontDisplay` 中指定，例如 `'optional'` 或 `'swap'`：

```scss
@font-face {
  font-family: "AlibabaPuHuiTi";
  src: url("https://your-cos.com/static/fonts/1.0.0/AlibabaPuHuiTi-400.woff") format("woff");
  font-weight: 400;
}
```

## Vite 插件

配合 Vite 使用时，可引入 `virtual:charbi-font` 获取构建版本号：

```typescript
import { FONT_BUILD_VERSION } from "virtual:charbi-font";

console.log(FONT_BUILD_VERSION); // "1.0.0"
```

在 `vite.config.ts` 中启用插件：

```typescript
import charbiFont from "charbi-font/vite";

export default defineConfig({
  plugins: [charbiFont()]
});
```

## TypeScript 类型支持

如果你在业务代码中直接使用虚拟模块：

```ts
import { FONT_BUILD_VERSION } from "virtual:charbi-font";
```

请在项目中启用 `charbi-font/client` 类型入口（二选一）：

1. `/// <reference types="charbi-font/client" />`（推荐放在 `env.d.ts`）
2. `tsconfig.json` -> `compilerOptions.types` 中添加 `"charbi-font/client"`

## 使用命令

```bash
charbi          # 构建 + 上传到 CDN
charbi build    # 仅构建（生成字体子集到缓存目录）
charbi upload   # 仅上传（上传缓存目录中的字体到 CDN）
charbi --mode production  # 使用 production 模式
```

## 关于名称

最开始让 AI 起名，我说可以造组合字，于是在一堆名称中我一眼看到了 `char + build = charbi`（你没有偷摸骂我吧？🤔）

## License

MIT
