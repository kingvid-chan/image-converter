/**
 * BMP 24-bit 编码器
 *
 * BMP 文件格式（24-bit 无压缩）：
 * ┌──────────────────────────┐
 * │ BITMAPFILEHEADER (14 B)  │  bfType='BM', bfSize, bfReserved, bfOffBits=54
 * ├──────────────────────────┤
 * │ BITMAPINFOHEADER (40 B)  │  biWidth, biHeight, biBitCount=24, etc.
 * ├──────────────────────────┤
 * │ Pixel Data               │  BGR 顺序，底向上，每行4字节对齐
 * └──────────────────────────┘
 *
 * 注意：BMP 像素数据为 BGR 顺序（非 RGB），且行顺序为底向上（最后一行在前）。
 */

/**
 * 将 Canvas ImageData (RGBA) 编码为 BMP 24-bit Blob
 * @param imageData - canvas.getImageData() 返回的 RGBA 像素数据
 * @returns image/bmp 格式的 Blob
 */
export function bmpEncode(imageData: ImageData): Blob {
  const { width, height, data } = imageData

  // 每行字节数（BGR 每像素 3 字节 + 4 字节对齐填充）
  const rowBytes = Math.floor((width * 3 + 3) / 4) * 4
  const pixelDataSize = rowBytes * height
  const fileSize = 54 + pixelDataSize // 14 (file header) + 40 (info header) + pixel data

  // 创建 ArrayBuffer（54 字节头部 + 像素数据）
  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  let offset = 0

  // === BITMAPFILEHEADER (14 bytes) ===
  // bfType: 'BM' (2 bytes)
  view.setUint8(offset, 0x42)      // 'B'
  view.setUint8(offset + 1, 0x4D)  // 'M'
  offset += 2

  // bfSize: 文件总大小 (4 bytes, little-endian)
  view.setUint32(offset, fileSize, true)
  offset += 4

  // bfReserved1 & bfReserved2: 保留 (4 bytes, 全0)
  view.setUint32(offset, 0, true)
  offset += 4

  // bfOffBits: 像素数据偏移 = 54 (4 bytes, little-endian)
  view.setUint32(offset, 54, true)
  offset += 4

  // === BITMAPINFOHEADER (40 bytes) ===
  // biSize: 信息头大小 = 40 (4 bytes)
  view.setUint32(offset, 40, true)
  offset += 4

  // biWidth: 图片宽度 (4 bytes, signed int)
  view.setInt32(offset, width, true)
  offset += 4

  // biHeight: 图片高度 (4 bytes, signed int, 正数=底向上)
  view.setInt32(offset, height, true)
  offset += 4

  // biPlanes: 色彩平面数 = 1 (2 bytes)
  view.setUint16(offset, 1, true)
  offset += 2

  // biBitCount: 每像素位数 = 24 (2 bytes)
  view.setUint16(offset, 24, true)
  offset += 2

  // biCompression: 压缩方式 = 0 (BI_RGB 无压缩) (4 bytes)
  view.setUint32(offset, 0, true)
  offset += 4

  // biSizeImage: 像素数据大小 (4 bytes)
  view.setUint32(offset, pixelDataSize, true)
  offset += 4

  // biXPelsPerMeter: 水平分辨率 ≈ 72 DPI = 2835 pixels/meter (4 bytes)
  view.setInt32(offset, 2835, true)
  offset += 4

  // biYPelsPerMeter: 垂直分辨率 ≈ 72 DPI = 2835 pixels/meter (4 bytes)
  view.setInt32(offset, 2835, true)
  offset += 4

  // biClrUsed: 使用的颜色数 = 0 (2^24 所有颜色) (4 bytes)
  view.setUint32(offset, 0, true)
  offset += 4

  // biClrImportant: 重要颜色数 = 0 (所有颜色都重要) (4 bytes)
  view.setUint32(offset, 0, true)
  offset += 4

  // === 像素数据 (BGR, 底向上, 4字节对齐) ===
  const pixelOffset = 54
  const rgbaLen = width * 4 // RGBA 每行字节数

  for (let y = 0; y < height; y++) {
    // BMP 行顺序是底向上：最后一行（height-1）对应数据第一行
    const srcRowStart = (height - 1 - y) * rgbaLen
    const dstRowStart = pixelOffset + y * rowBytes

    for (let x = 0; x < width; x++) {
      const srcOffset = srcRowStart + x * 4
      const dstOffset = dstRowStart + x * 3

      // RGBA → BGR（丢弃 Alpha）
      view.setUint8(dstOffset, data[srcOffset + 2])       // B ← R
      view.setUint8(dstOffset + 1, data[srcOffset + 1])   // G ← G
      view.setUint8(dstOffset + 2, data[srcOffset])       // R ← B
    }

    // 填充字节置零
    const paddingStart = dstRowStart + width * 3
    const paddingEnd = dstRowStart + rowBytes
    for (let p = paddingStart; p < paddingEnd; p++) {
      view.setUint8(p, 0)
    }
  }

  return new Blob([buffer], { type: 'image/bmp' })
}
