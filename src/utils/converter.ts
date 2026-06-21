import type { ImageFormat, ConversionResult, ImageFile } from '../types'
import { QUALITY_PRESETS } from '../types'
import { bmpEncode } from './bmp-encoder'

/**
 * 检测浏览器是否支持输出指定格式
 * 用于 WebP 等格式的 feature detection
 */
function checkFormatSupport(format: ImageFormat): boolean {
  if (format === 'image/bmp') {
    // canvas.toBlob 不支持 BMP 输出，使用自研编码器（总是可用）
    return true
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  // 尝试通过 toDataURL 检测
  const dataUrl = canvas.toDataURL(format)
  // 如果浏览器不支持，toDataURL 会回退到 'data:image/png'
  return dataUrl.startsWith(`data:${format}`)
}

/** 缓存的格式支持检测结果 */
const formatSupportCache = new Map<ImageFormat, boolean>()

/** 获取格式支持状态（带缓存） */
export function isFormatSupported(format: ImageFormat): boolean {
  if (!formatSupportCache.has(format)) {
    formatSupportCache.set(format, checkFormatSupport(format))
  }
  return formatSupportCache.get(format)!
}

/**
 * 将文件加载为 HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`无法解析图片文件 "${file.name}"，文件可能已损坏`))
    }
    img.src = url
  })
}

/**
 * 将 Canvas 转换为指定格式的 Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, format: ImageFormat): Promise<Blob> {
  // BMP 使用自研编码器
  if (format === 'image/bmp') {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return Promise.reject(new Error('无法获取 Canvas 2D 上下文'))
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return Promise.resolve(bmpEncode(imageData))
  }

  // PNG/JPEG/WebP 使用原生 toBlob
  const quality = QUALITY_PRESETS[format]

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error(`转换为 ${format} 失败`))
        }
      },
      format,
      quality,
    )
  })
}

/**
 * 转换单个图片文件
 *
 * @param imageFile - 已验证的图片文件
 * @param targetFormat - 目标格式
 * @returns 转换结果（包含原图和转换后图片的 Blob、URL、大小对比）
 */
export async function convertImage(
  imageFile: ImageFile,
  targetFormat: ImageFormat,
): Promise<ConversionResult> {
  // 1. 加载图片
  const img = await loadImage(imageFile.file)

  // 2. 创建 Canvas 并绘制原图
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法获取 Canvas 2D 上下文')
  }

  // 对于 JPEG 目标格式，先填充白色背景（JPEG 不支持透明）
  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.drawImage(img, 0, 0)

  // 3. 转换格式
  const convertedBlob = await canvasToBlob(canvas, targetFormat)

  // 4. 生成预览 URL
  const convertedPreviewUrl = URL.createObjectURL(convertedBlob)

  return {
    id: imageFile.id,
    originalFile: imageFile,
    convertedBlob,
    originalSize: imageFile.size,
    convertedSize: convertedBlob.size,
    originalFormat: imageFile.format,
    targetFormat,
    originalPreviewUrl: imageFile.previewUrl,
    convertedPreviewUrl,
  }
}

/**
 * 批量转换图片
 *
 * @param imageFiles - 已验证的图片文件列表
 * @param targetFormat - 统一目标格式
 * @param onProgress - 进度回调 (已完成数, 总数)
 * @returns 转换结果列表
 */
export async function convertBatch(
  imageFiles: ImageFile[],
  targetFormat: ImageFormat,
  onProgress?: (completed: number, total: number) => void,
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  for (let i = 0; i < imageFiles.length; i++) {
    const result = await convertImage(imageFiles[i], targetFormat)
    results.push(result)
    onProgress?.(i + 1, imageFiles.length)
  }

  return results
}
