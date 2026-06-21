# ADR-002: BMP 格式编码策略

## 状态

已采纳 (2026-06-21)

## 上下文

需求要求支持 PNG/JPEG/WebP/BMP 四种格式**互相转换**。HTML5 Canvas API 的 `canvas.toBlob()` 原生支持 PNG、JPEG、WebP 输出，但**不支持 BMP 格式**（`image/bmp` 不被任何主流浏览器的 `toBlob` 支持）。

因此，将 PNG/JPEG/WebP 转换为 BMP 需要额外的编码方案。

## 决策

**自研轻量 BMP 24-bit 编码器**（`src/utils/bmp-encoder.ts`），约 80 行代码。

### 理由

1. **BMP 24-bit 格式极其简单**：固定 54 字节头部 + BGR 像素数据（每行 4 字节对齐），无需压缩算法
2. **零依赖**：无需引入第三方 BMP 编码库
3. **体积可控**：~80 行代码，~2KB 压缩后
4. **完全可控**：可精确控制输出格式，便于调试和扩展

### BMP 文件结构

```
BMP 文件 = BITMAPFILEHEADER (14 bytes) + BITMAPINFOHEADER (40 bytes) + Pixel Data

BITMAPFILEHEADER:
  bfType      'BM' (2 bytes)
  bfSize      文件总大小 (4 bytes)
  bfReserved1 0 (2 bytes)
  bfReserved2 0 (2 bytes)
  bfOffBits   像素数据偏移 = 54 (4 bytes)

BITMAPINFOHEADER:
  biSize          40 (4 bytes)
  biWidth         图片宽度 (4 bytes)
  biHeight        图片高度 (4 bytes, 正数=底向上)
  biPlanes        1 (2 bytes)
  biBitCount      24 (2 bytes)
  biCompression   0 (4 bytes, 0=BI_RGB 无压缩)
  biSizeImage     像素数据大小 (4 bytes)
  biXPelsPerMeter 2835 ≈ 72 DPI (4 bytes)
  biYPelsPerMeter 2835 ≈ 72 DPI (4 bytes)
  biClrUsed       0 (4 bytes)
  biClrImportant  0 (4 bytes)

Pixel Data: BGR 顺序，底向上，每行 4 字节对齐
```

### 编码流程

```
canvas.getImageData(0, 0, w, h) → ImageData
  → 读取 RGBA 像素
  → 转为 BGR 顺序，丢弃 Alpha
  → 按行写入（底向上，4 字节对齐填充）
  → 拼接头部 + 像素数据
  → new Blob([header, pixelData], { type: 'image/bmp' })
```

### 局限性（已知技术债）

| 局限 | 说明 |
|---|---|
| 仅支持 24-bit | 不支持 32-bit（含 Alpha 通道）、8-bit 调色板、1-bit 单色 |
| 无压缩 | 仅支持 BI_RGB 无压缩模式，不支持 RLE |
| BMP 文件较大 | 无压缩导致 BMP 输出文件较大（这是 BMP 格式特性，非编码器缺陷） |
| 不保留 Alpha | 透明度通道丢失，用白色填充 |

## 影响

- `src/utils/bmp-encoder.ts` 需要单元测试覆盖
- 代码注释需说明 BMP 格式结构，便于后续维护
- 如果未来需要 32-bit BMP（含透明通道），编码器需扩展

## 备选方案

### 方案 B：使用 `bmp-js` npm 包
- npm 包 `bmp-js` 提供完整的 BMP 编解码
- 体积 ~5KB，支持多种位深度
- **未采纳原因**：增加外部依赖，BMP 24-bit 编码足够简单，自研更轻量且可控；包维护频率低（上次更新 2021 年）

### 方案 C：放弃 BMP 输出，仅支持 BMP→其他格式
- 简化实现，避免 BMP 编码
- **未采纳原因**：需求明确要求"四种格式互转"，BMP 输出是硬需求
