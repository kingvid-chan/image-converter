import JSZip from 'jszip'
import type { ConversionResult, ImageFormat } from '../types'
import { FORMAT_EXTENSIONS } from '../types'

/**
 * 触发浏览器下载单个 Blob
 * @param blob - 要下载的 Blob
 * @param filename - 下载文件名
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 延迟释放 URL 确保下载触发
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * 生成转换后的文件名
 * @param originalName - 原文件名
 * @param targetFormat - 目标格式
 * @returns 新文件名，格式：原文件名_转换.扩展名
 */
function generateFilename(originalName: string, targetFormat: ImageFormat): string {
  // 去掉原扩展名
  const dotIndex = originalName.lastIndexOf('.')
  const baseName = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName
  const ext = FORMAT_EXTENSIONS[targetFormat]
  return `${baseName}_转换${ext}`
}

/**
 * 下载单个转换结果
 */
export function downloadSingleResult(result: ConversionResult): void {
  const filename = generateFilename(result.originalFile.file.name, result.targetFormat)
  downloadBlob(result.convertedBlob, filename)
}

/**
 * 批量打包下载为 ZIP
 * @param results - 转换结果列表
 * @param targetFormat - 目标格式（用于生成文件名扩展名）
 * @param zipFilename - ZIP 包文件名，默认为 images_转换后.zip
 */
export async function downloadZip(
  results: ConversionResult[],
  targetFormat: ImageFormat,
  zipFilename = 'images_转换后.zip',
): Promise<void> {
  const zip = new JSZip()

  for (const result of results) {
    const filename = generateFilename(result.originalFile.file.name, targetFormat)
    zip.file(filename, result.convertedBlob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, zipFilename)
}
