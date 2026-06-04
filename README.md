# @uiron/charbi

中文字体子集化工具。扫描项目源码提取字符，构建精简字体文件，并可按版本上传到 CDN。

## 特性

- **按需子集化**：只保留代码中实际使用的字符，减少字体体积
- **多目录多后缀扫描**：支持按 `srcDir` + `extensions` 精准控制扫描范围
- **多字重统一管理**：同一字体家族可配置多个字重并统一输出
- **可选 CDN 上传**：支持上传到腾讯云 COS 等对象存储
- **构建缓存复用**：复用本地缓存，减少重复下载与重复处理

## 安装

安装主包：

```bash
pnpm add @uiron/charbi
```

如果要使用 CDN 上传功能，再安装 COS SDK：

```bash
pnpm add cos-nodejs-sdk-v5
```

## 快速开始

### 1. 创建配置文件

在项目根目录创建 `fonts.config.ts`：

```ts
import { defineConfig } from "@uiron/charbi/config";

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
      // styleFormat 可选 默认为 "css"
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
charbi
charbi build
charbi upload
```

- `charbi`：构建并上传
- `charbi build`：仅构建子集字体
- `charbi upload`：仅上传已构建产物

### 3. 引入字体

在入口文件中引入生成的样式入口：

```ts
import "@/styles/fonts";
```

业务中按正常方式声明字体：

```css
.my-text {
  font-family: "AlibabaPuHuiTi", sans-serif;
  font-weight: 400;
}
```

## 构建流程

```text
1 下载字体   -> 下载并缓存字体源文件
2 扫描代码   -> 按目录和后缀扫描源码
3 提取字符   -> 提取中文 英文 数字 常用符号
4 生成子集   -> 使用 fontmin 产出目标格式字体
5 生成样式   -> 输出 font-*.css 或 font-*.scss 与 fonts 汇总文件
```

## 输出结构

```text
项目目录/
├── src/styles/
│   ├── font-assets/
│   │   ├── alibaba-pu-hui-ti.css   # 字体家族样式
│   │   └── fonts.css               # 汇总引入文件
│   └── fonts.css                   # 业务侧入口文件
└── node_modules/@uiron/charbi/.cache/
    ├── subsets/                    # 子集字体构建产物
    ├── words/                      # 各子集对应的字符清单
    └── fonts/
        └── AlibabaPuHuiTi-400.ttf  # 原始字体缓存
```

## 配置说明

### `build.scan`

| 配置项       | 类型                 | 默认值           | 说明                     |
| ------------ | -------------------- | ---------------- | ------------------------ |
| `srcDir`     | `string[]`           | `["src"]`        | 扫描目录列表             |
| `extensions` | `string[]`           | 示例中的默认列表 | 扫描的文件后缀           |
| `extraText`  | `string \| string[]` | -                | 所有字体都额外包含的字符 |

### `build.fonts[]`

| 配置项      | 类型                         | 必填 | 说明                     |
| ----------- | ---------------------------- | ---- | ------------------------ |
| `family`    | `string`                     | 是   | 字体家族名 用于分组      |
| `name`      | `string`                     | 是   | 字体显示名               |
| `weight`    | `number`                     | 是   | 字重                     |
| `url`       | `string`                     | 是   | 字体源文件地址           |
| `style`     | `"normal" \| "italic"`       | 否   | 字体样式                 |
| `format`    | `"woff" \| "woff2" \| "ttf"` | 否   | 覆盖全局输出格式         |
| `extraText` | `string \| string[]`         | 否   | 仅当前字体额外包含的字符 |

### `build.output`

| 配置项        | 类型                                                               | 默认值         | 说明                    |
| ------------- | ------------------------------------------------------------------ | -------------- | ----------------------- |
| `cssDir`      | `string`                                                           | `"src/styles"` | 样式输出目录            |
| `format`      | `"woff" \| "woff2" \| "ttf"`                                       | `"woff"`       | 子集字体格式            |
| `styleFormat` | `"scss" \| "css"`                                                  | `"css"`        | 样式文件格式            |
| `fontDisplay` | `"auto" \| "block" \| "swap" \| "fallback" \| "optional" \| false` | 默认不写该属性 | 是否输出 `font-display` |

### `build.cacheDir`

缓存目录默认值：`node_modules/@uiron/charbi/.cache/fonts`。  
也可在配置中自定义：

```ts
export default defineConfig({
  build: {
    cacheDir: ".cache/fonts"
  }
});
```

## 生成结果

默认生成的 `@font-face` **不包含** `font-display`，以避免默认 `swap` 引发明显 FOUT。  
如果需要可在 `build.output.fontDisplay` 中指定，例如 `"optional"` 或 `"swap"`。

```scss
@font-face {
  font-family: "AlibabaPuHuiTi";
  src: url("https://your-cos.com/static/fonts/1.0.0/AlibabaPuHuiTi-400.woff") format("woff");
  font-weight: 400;
}
```

## Vite 插件

在 Vite 中使用默认插件 `CharbiFont()`（无参数）：

```ts
import { defineConfig } from "vite";
import CharbiFont from "@uiron/charbi/vite";

export default defineConfig({
  plugins: [CharbiFont()]
});
```

版本号解析规则与虚拟模块中的 `FONT_BUILD_VERSION` 一致：

`VITE_FONT_BUILD_VERSION` -> 项目根 `package.json` -> `npm_package_version` -> `0.0.1`

虚拟模块 ID 为 `virtual:charbi`，导出如下：

- `FONT_BUILD_VERSION`：最终字体版本号
- `BUILD_FONT_FACES`：由 `fonts.config.ts` 推导出的字体描述列表
- `FONT_ASSET_BASE_URL`：当配置了 `cos.cdnUrl` 与 `cos.basePath` 时返回 CDN 前缀，否则为 `undefined`

示例（微信小程序 `uni.loadFontFace`）：

```ts
import { FONT_ASSET_BASE_URL, FONT_BUILD_VERSION, BUILD_FONT_FACES } from "virtual:charbi";

for (const face of BUILD_FONT_FACES) {
  const base = FONT_ASSET_BASE_URL;
  if (!base) continue;
  uni.loadFontFace({
    global: true,
    family: face.family,
    source: `url("${base}/${face.file}")`,
    desc: {
      style: face.style,
      weight: face.weight,
      variant: face.variant
    }
  });
}
```

## TypeScript 类型支持

如果在业务中直接导入虚拟模块：

```ts
import { BUILD_FONT_FACES, FONT_BUILD_VERSION } from "virtual:charbi";
```

请启用 `@uiron/charbi/client` 类型声明（二选一）：

1. 在 `env.d.ts` 添加 `/// <reference types="@uiron/charbi/client" />`
2. 在 `tsconfig.json` 的 `compilerOptions.types` 中添加 `"@uiron/charbi/client"`

## 使用命令

```bash
charbi
charbi build
charbi upload
charbi --mode production
```

- `charbi`：构建并上传到 CDN
- `charbi build`：仅构建子集字体到缓存目录
- `charbi upload`：仅上传缓存目录中的构建产物
- `charbi --mode production`：以生产模式运行

## 关于名称

最开始让 AI 起名，我说可以造组合字，于是在一堆名称中我一眼看到了 `char + build = charbi`（你没有偷摸骂我吧？🤔）

## License

MIT
