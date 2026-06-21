# 图片格式转换器 当前架构

## 系统目标与边界

图片格式转换器是一个**纯前端 SPA**，用户在浏览器中完成 PNG/JPEG/WebP/BMP 四种格式的图片互转，所有处理在本地浏览器完成，不上传服务器。

**边界：**
- 仅处理浏览器支持的图片格式（PNG/JPEG/WebP/BMP）
- 无后端、无数据库、无登录
- 单页应用，无路由（无需前端路由库）
- 部署在 `/projects/image-converter/` 子路径下
- 不涉及任何远程图片上报、遥测或分析

## 技术栈与选择理由

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | React 18 + TypeScript | 生态成熟、TypeScript 类型安全、社区资源丰富 |
| 构建 | Vite 5 | 极速 HMR、ESM 原生支持、零配置 TypeScript、与 React 配合良好 |
| 样式 | Tailwind CSS 3 | 原子化 CSS、响应式便捷、无需额外 CSS 文件 |
| 格式转换 | HTML5 Canvas API (`toBlob`) | 浏览器原生、无依赖、性能好 |
| BMP 编码 | 自研轻量编码器 | `canvas.toBlob()` 不支持 `image/bmp`，BMP 24-bit 格式简单（~80 行） |
| 打包下载 | JSZip | 纯 JS、流式压缩、浏览器兼容好 |
| 测试 | Playwright | 真实浏览器环境、截图对比、多浏览器支持 |
| 状态管理 | React Context + useReducer | 无需 Redux，状态结构简单，Context 足够 |

**未引入：**
- 前端路由库（单页无需路由）
- 状态管理库（Context 足够）
- UI 组件库（Tailwind 手写组件保持轻量）
- axios/fetch 封装（无 API 调用）

## 模块职责与依赖

```
src/
├── main.tsx                  # 入口，挂载 App
├── App.tsx                   # 根组件：模式切换、全局状态 Context
├── context/
│   └── AppContext.tsx         # useReducer 全局状态 + Provider
├── types/
│   └── index.ts              # TypeScript 类型定义
├── utils/
│   ├── converter.ts          # Canvas 格式转换核心
│   ├── bmp-encoder.ts        # BMP 24-bit 编码器
│   ├── validator.ts          # 文件校验（格式/大小/损坏检测）
│   └── download.ts           # 单文件下载 & JSZip 打包下载
├── components/
│   ├── Header.tsx            # 标题栏 + 版本信息
│   ├── ModeTabs.tsx          # 单文件/批量模式切换
│   ├── FileDropZone.tsx      # 拖拽 + 点击选择文件
│   ├── FormatSelector.tsx    # 目标格式下拉选择
│   ├── single/
│   │   ├── SingleMode.tsx    # 单文件模式容器
│   │   ├── PreviewComparison.tsx  # 左右预览对比
│   │   └── SizeComparison.tsx     # 文件大小变化展示
│   ├── batch/
│   │   ├── BatchMode.tsx     # 批量模式容器
│   │   ├── FileList.tsx      # 文件缩略图列表（含移除）
│   │   ├── ConversionProgress.tsx # 批量转换进度条
│   │   └── BatchResults.tsx  # 批量结果列表
│   ├── ErrorToast.tsx        # 错误/警告提示
│   └── DownloadButton.tsx    # 下载按钮
└── styles/
    └── index.css             # Tailwind 指令 + 全局样式覆盖
```

**依赖方向：**
```
App → Context (Provider)
  ↓
Components → Context (useContext)
Components → utils/* (纯函数)
utils/* 之间无相互依赖
```

## 数据流、状态流与外部接口

### 全局状态 (AppContext)

```typescript
type AppState = {
  mode: 'single' | 'batch';
  files: ImageFile[];           // 当前待处理文件
  targetFormat: ImageFormat;    // 目标格式
  results: ConversionResult[];  // 转换结果
  errors: AppError[];           // 错误/警告消息
  converting: boolean;          // 转换进行中
};

type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp';
```

### Actions (useReducer)

```
SET_MODE(mode)
ADD_FILES(files: File[])        → 校验 → 过滤合法/非法 → 更新 files + errors
REMOVE_FILE(index)
SET_TARGET_FORMAT(format)
CONVERT_START()
CONVERT_SUCCESS(results)
CONVERT_ERROR(error)
CLEAR_ERRORS()
RESET()
```

### 数据流图

```
用户拖拽/选择文件
  → FileDropZone.onFiles(files)
    → dispatch(ADD_FILES, files)
      → validateFile() 逐个校验
        → 合法 → 生成缩略图 URL
        → 非法 → 添加到 errors[]
      → state.files 更新，UI 渲染预览

用户选择目标格式
  → FormatSelector.onChange(format)
    → dispatch(SET_TARGET_FORMAT, format)

用户点击转换
  → ConvertButton.onClick()
    → dispatch(CONVERT_START)
    → 逐个 convertImage(file, targetFormat)
      → createImageBitmap(file) / new Image()
      → canvas.drawImage()
      → targetFormat === 'image/bmp'
          ? encodeBMP(canvas)
          : canvas.toBlob(targetFormat, quality)
      → 计算大小对比
    → dispatch(CONVERT_SUCCESS, results)

用户下载
  → 单文件: downloadBlob(result.blob, filename)
  → 批量:   JSZip → addFile() 逐个 → generateAsync() → downloadBlob()
```

### 外部接口

**无。** 不上传、不请求 API、不连接服务器。

## Canvas API 转换策略

### 各格式 MIME Type 与质量参数

| 目标格式 | MIME Type | canvas.toBlob 支持 | quality 默认值 | 说明 |
|---|---|---|---|---|
| PNG | `image/png` | ✅ 原生支持 | N/A (无损) | 透明度保留 |
| JPEG | `image/jpeg` | ✅ 原生支持 | 0.92 | 无透明度，白底填充 |
| WebP | `image/webp` | ✅ Chrome/Firefox/Safari | 0.92 | 有损+无损均支持 |
| BMP | `image/bmp` | ❌ 不支持 | N/A | 自研编码器，24-bit 无损 |

### 转换流程

```
1. 读取 File → ArrayBuffer
2. 创建 Image 元素，设置 src = URL.createObjectURL(file)
3. 等待 Image.onload
4. 创建 Canvas (width = image.naturalWidth, height = image.naturalHeight)
5. ctx.drawImage(image, 0, 0)
6. 转换:
   - JPEG/PNG/WebP: canvas.toBlob(mimeType, quality) → Blob
   - BMP: 先 ctx.getImageData() 获取像素 → bmpEncode(imageData) → Blob
7. 返回 { blob, originalSize, convertedSize }
```

### 异常检测

- Image.onerror → 损坏图片
- MIME type 不匹配 → 非图片文件
- File size > 50MB 或 dimensions > 8192px → 超大图片警告

## 测试策略

- **单元测试**：`converter.ts`、`bmp-encoder.ts`、`validator.ts`（如后续需要）
- **E2E 测试**：Playwright 浏览器自动化
  - 单文件转换流程（PNG→JPEG, JPEG→WebP, WebP→PNG, BMP→PNG, PNG→BMP）
  - 批量转换 + zip 下载
  - 非图片文件错误提示
  - 损坏图片错误提示
  - 同格式转换提示
  - 响应式布局（移动端/桌面端）
- 测试脚本放在 `tests/` 目录

## 部署拓扑

```
用户浏览器
  ↓ HTTPS
Nginx (Aliyun)
  ├── /projects/image-converter/ → /var/www/image-converter/dist/
  │   ├── index.html (Cache-Control: no-cache)
  │   ├── assets/*.js?v=0.0.1
  │   ├── assets/*.css?v=0.0.1
  │   └── favicon.ico?v=0.0.1
  └── try_files $uri /index.html (SPA fallback)
```

**Vite 配置:**
```typescript
export default defineConfig({
  base: '/projects/image-converter/',
  // ...
})
```

## 安全边界

- 所有图片处理在浏览器 Canvas 中完成，无网络传输
- 不包含任何遥测、分析、日志上报代码
- 无第三方 CDN 脚本依赖（全部 bundle）
- JSZip 等第三方库通过 npm 引入、Vite 打包，不运行时加载外部脚本
- Canvas 像素操作在浏览器沙箱内，无文件系统访问

## 已知技术债

- BMP 编码器仅支持 24-bit 无压缩输出，不支持 32-bit（含 alpha 通道）和 RLE 压缩
- 超大图片（>4096px）转换可能因 Canvas 内存限制失败，当前仅做警告提示
- 暂不支持 SVG、TIFF、AVIF 格式
- 无 PWA / Service Worker 离线缓存

## 关联 ADR 与最近变更

- [ADR-001](./decisions/ADR-001-技术栈选型.md) — React + TypeScript + Vite + Tailwind CSS
- [ADR-002](./decisions/ADR-002-BMP格式编码策略.md) — BMP 自研编码器 vs 第三方库
- 最近变更：iteration/0.0.1 — 初版技术方案
