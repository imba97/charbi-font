# charbi

中文字体子集化工具，扫描代码提取字符，生成精简字体包。

## 特性

- ✂️ **字体子集化** — 仅包含代码中实际使用的字符
- 📁 **代码扫描** — 递归扫描源码文件，提取字符使用情况
- 📦 **多字重合并** — 同一字体的多个字重合并到一个文件
- ☁️ **CDN 上传** — 可上传到 CDN（如腾讯云 COS）
- ⚡ **本地缓存** — 字体文件本地缓存，避免重复下载

## 安装

```bash
npm install charbi
# 或
pnpm add charbi
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
import { defineConfig } from "charbi/config";

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
    }
  },
  cos: {
    secretId: process.env.COS_SECRET_ID,
    secretKey: process.env.COS_SECRET_KEY,
    bucket: "your-bucket",
    region: "ap-guangzhou",
    basePath: "static/fonts/{version}",
    cdnUrl: "https://your-cos.com"
  }
});
```

### 2. 执行构建

```bash
charbi
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
5. 生成 CSS  → 输出 font-*.scss 和 fonts.scss
```

## 输出结构

```
src/styles/
├── font-assets/
│   ├── alibaba-pu-hui-ti.scss   # 阿里普惠体（多字重）
│   └── fonts.scss               # 汇总引入文件
└── fonts.scss                  # 入口文件
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

| 配置项        | 类型                         | 默认值         | 说明         |
| ------------- | ---------------------------- | -------------- | ------------ |
| `cssDir`      | `string`                     | `'src/styles'` | CSS 输出目录 |
| `format`      | `'woff' \| 'woff2' \| 'ttf'` | `'woff'`       | 输出格式     |
| `styleFormat` | `'scss' \| 'css'`            | `'scss'`       | 样式文件格式 |

### `cacheDir`

自定义缓存目录（默认：`node_modules/charbi/.cache/fonts`）：

```typescript
export default defineConfig({
  cacheDir: ".cache/fonts", // 相对于项目根目录
  // 或绝对路径
  cacheDir: "/path/to/cache/fonts"
});
```

## 生成结果

生成的 CSS 使用 `font-display: swap`：

```scss
@font-face {
  font-family: "AlibabaPuHuiTi";
  src: url("https://your-cos.com/static/fonts/1.0.0/AlibabaPuHuiTi-400.woff") format("woff");
  font-weight: 400;
}
```

## 使用命令

```bash
charbi    # 执行构建
```

## License

MIT
