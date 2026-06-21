import { FORMAT_LABELS } from '../../types'
import type { ConversionResult } from '../../types'

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

interface SizeComparisonProps {
  result: ConversionResult
}

export default function SizeComparison({ result }: SizeComparisonProps) {
  const { originalSize, convertedSize, originalFormat, targetFormat } = result

  const isLarger = convertedSize > originalSize
  const isSame = convertedSize === originalSize
  const ratio = isSame ? 0 : isLarger
    ? ((convertedSize - originalSize) / originalSize * 100)
    : ((originalSize - convertedSize) / originalSize * 100)

  return (
    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">文件大小对比</h4>

      <div className="space-y-3">
        {/* 原始文件 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">
              原文件 ({FORMAT_LABELS[originalFormat]})
            </span>
            <span className="font-medium text-gray-700">{formatSize(originalSize)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gray-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((originalSize / Math.max(originalSize, convertedSize, 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* 转换后文件 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">
              转换后 ({FORMAT_LABELS[targetFormat]})
            </span>
            <span className={`font-medium ${isLarger ? 'text-orange-600' : 'text-green-600'}`}>
              {formatSize(convertedSize)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isLarger ? 'bg-orange-400' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((convertedSize / Math.max(originalSize, convertedSize, 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* 变化摘要 */}
        <div className="text-center pt-2">
          {isSame ? (
            <span className="text-sm text-gray-500">文件大小未变化</span>
          ) : isLarger ? (
            <span className="text-sm text-orange-600 font-medium">
              ⬆ 文件增大 {ratio.toFixed(1)}%
            </span>
          ) : (
            <span className="text-sm text-green-600 font-medium">
              ⬇ 文件减小 {ratio.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
