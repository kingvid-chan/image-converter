import { FORMAT_LABELS } from '../../types'
import type { ConversionResult } from '../../types'

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

interface PreviewComparisonProps {
  result: ConversionResult
}

export default function PreviewComparison({ result }: PreviewComparisonProps) {
  const { originalFile, originalPreviewUrl, convertedPreviewUrl, originalFormat, targetFormat, originalSize, convertedSize } = result

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* 原图 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            原图
          </span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
            {FORMAT_LABELS[originalFormat]}
          </span>
        </div>

        <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[200px] overflow-hidden">
          <img
            src={originalPreviewUrl}
            alt={`原图 - ${originalFile.file.name}`}
            className="max-w-full max-h-64 object-contain"
          />
        </div>

        <div className="mt-2 text-xs text-gray-500 truncate" title={originalFile.file.name}>
          {originalFile.file.name}
        </div>
        <div className="text-xs text-gray-400">
          尺寸: {originalFile.width}×{originalFile.height} · 大小: {formatSize(originalSize)}
        </div>
      </div>

      {/* 转换后 */}
      <div className="bg-white rounded-lg border border-green-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
            转换后
          </span>
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
            {FORMAT_LABELS[targetFormat]}
          </span>
        </div>

        <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[200px] overflow-hidden">
          <img
            src={convertedPreviewUrl}
            alt={`转换后 - ${targetFormat}`}
            className="max-w-full max-h-64 object-contain"
          />
        </div>

        <div className="mt-2 text-xs text-gray-500">
          新文件
        </div>
        <div className="text-xs text-gray-400">
          大小: {formatSize(convertedSize)}
        </div>
      </div>
    </div>
  )
}
