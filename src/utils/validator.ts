import type { ImageFormat, ValidationResult } from '../types'
import { EXTENSION_TO_FORMAT } from '../types'

/** 支持的图片 MIME 类型集合 */
const SUPPORTED_MIME_TYPES: Set<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
])

/** 通过文件头 magic bytes 判断文件类型 */
async function detectFormatByHeader(file: File): Promise<ImageFormat | null> {
  const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer())

  // BMP: 'BM' (0x42 0x4D)
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
    return 'image/bmp'
  }

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png'
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg'
  }

  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    // Read more bytes to check for WEBP
    const moreBytes = new Uint8Array(await file.slice(8, 12).arrayBuffer())
    if (moreBytes[0] === 0x57 && moreBytes[1] === 0x45 && moreBytes[2] === 0x42 && moreBytes[3] === 0x50) {
      return 'image/webp'
    }
  }

  return null
}

/** 从文件名提取扩展名 */
function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  if (idx === -1) return ''
  return filename.substring(idx).toLowerCase()
}

/** 确定图片格式：优先 MIME type，其次扩展名，最后文件头 */
function determineFormat(file: File, headerFormat: ImageFormat | null): ImageFormat | null {
  // 1. 优先使用浏览器识别的 MIME type
  if (file.type && SUPPORTED_MIME_TYPES.has(file.type)) {
    return file.type as ImageFormat
  }

  // 2. 根据扩展名判断
  const ext = getExtension(file.name)
  if (ext && ext in EXTENSION_TO_FORMAT) {
    return EXTENSION_TO_FORMAT[ext]
  }

  // 3. 根据文件头 magic bytes 判断
  if (headerFormat) {
    return headerFormat
  }

  return null
}

/** 校验单个文件 */
export async function validateFile(file: File): Promise<ValidationResult> {
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  const MAX_DIMENSION = 8192 // 像素

  // 读取文件头获取 magic bytes
  const headerFormat = await detectFormatByHeader(file)

  // 确定格式
  const format = determineFormat(file, headerFormat)

  // 非图片文件
  if (!format) {
    const ext = getExtension(file.name)
    return {
      valid: false,
      status: 'invalid_format',
      error: `不支持的文件格式${ext ? `：${ext}` : ''}，请选择 PNG、JPEG、WebP 或 BMP 图片文件`,
    }
  }

  // 检测超大文件
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: true,
      status: 'oversized',
      error: `图片 "${file.name}" 大小超过 50MB（${(file.size / 1024 / 1024).toFixed(1)}MB），转换可能需要较长时间`,
    }
  }

  // 检测图片尺寸（通过加载图片获取）
  try {
    const dimensions = await getImageDimensions(file)
    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
      return {
        valid: true,
        status: 'oversized',
        error: `图片 "${file.name}" 尺寸较大（${dimensions.width}×${dimensions.height}），转换可能需要较长时间`,
      }
    }
  } catch {
    // 尺寸检测失败可能是损坏图片，后面转换时会再次检测
  }

  return {
    valid: true,
    status: 'valid',
  }
}

/** 获取图片尺寸 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法加载图片'))
    }
    img.src = url
  })
}

/** 获取图片的尺寸信息（不抛异常） */
export async function getImageDimensionsSafe(file: File): Promise<{ width: number; height: number } | null> {
  try {
    return await getImageDimensions(file)
  } catch {
    return null
  }
}

/** 批量校验文件，返回合法文件和错误列表 */
export async function validateFiles(
  files: File[],
): Promise<{ validFiles: File[]; errors: Array<{ message: string; level: 'error' | 'warning'; fileName: string }> }> {
  const validFiles: File[] = []
  const errors: Array<{ message: string; level: 'error' | 'warning'; fileName: string }> = []

  for (const file of files) {
    const result = await validateFile(file)
    if (!result.valid) {
      errors.push({
        message: result.error!,
        level: 'error',
        fileName: file.name,
      })
    } else if (result.status === 'oversized') {
      validFiles.push(file)
      errors.push({
        message: result.error!,
        level: 'warning',
        fileName: file.name,
      })
    } else {
      validFiles.push(file)
    }
  }

  return { validFiles, errors }
}
