import { useAppContext } from '../../context/AppContext'
import { FORMAT_LABELS } from '../../types'

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function FileList() {
  const { state, dispatch } = useAppContext()
  const { files } = state

  if (files.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        已选择 {files.length} 个文件
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="relative group bg-white rounded-lg border border-gray-200 p-2 hover:border-blue-300 transition-colors"
          >
            {/* 缩略图 */}
            <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mb-1.5">
              <img
                src={file.previewUrl}
                alt={file.file.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* 文件信息 */}
            <div className="text-xs truncate text-gray-600" title={file.file.name}>
              {file.file.name}
            </div>
            <div className="text-xs text-gray-400 flex justify-between mt-0.5">
              <span>{FORMAT_LABELS[file.format]}</span>
              <span>{formatSize(file.size)}</span>
            </div>

            {/* 移除按钮 */}
            <button
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs
                         opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center
                         hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation()
                dispatch({ type: 'REMOVE_FILE', payload: file.id })
              }}
              title="移除"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
