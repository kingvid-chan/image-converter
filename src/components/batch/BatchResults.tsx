import { FORMAT_LABELS } from '../../types'
import type { ConversionResult } from '../../types'

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

interface BatchResultsProps {
  results: ConversionResult[]
}

export default function BatchResults({ results }: BatchResultsProps) {
  if (results.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        转换结果 ({results.length} 个文件)
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {results.map(result => {
          const isLarger = result.convertedSize > result.originalSize
          const ratio = result.originalSize > 0
            ? Math.abs(((result.convertedSize - result.originalSize) / result.originalSize) * 100).toFixed(1)
            : '0'

          return (
            <div
              key={result.id}
              className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3"
            >
              {/* 缩略图 */}
              <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={result.convertedPreviewUrl}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate text-gray-700 font-medium">
                  {result.originalFile.file.name}
                </div>
                <div className="text-xs text-gray-400">
                  {FORMAT_LABELS[result.originalFormat]} → {FORMAT_LABELS[result.targetFormat]}
                </div>
              </div>

              {/* 大小对比 */}
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-500">
                  {formatSize(result.originalSize)} → {formatSize(result.convertedSize)}
                </div>
                <div className={`text-xs font-medium ${isLarger ? 'text-orange-600' : 'text-green-600'}`}>
                  {isLarger ? `+${ratio}%` : `-${ratio}%`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
