import { useCallback } from 'react'
import { useAppContext } from '../../context/AppContext'
import FileDropZone from '../FileDropZone'
import FormatSelector from '../FormatSelector'
import PreviewComparison from './PreviewComparison'
import SizeComparison from './SizeComparison'
import { convertImage } from '../../utils/converter'
import { downloadSingleResult } from '../../utils/download'
import type { AppError } from '../../types'

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function SingleMode() {
  const { state, dispatch } = useAppContext()
  const { files, targetFormat, results, converting } = state
  const hasFile = files.length > 0
  const hasResult = results.length > 0

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return

    dispatch({ type: 'CONVERT_START' })

    try {
      const result = await convertImage(files[0], targetFormat)
      dispatch({ type: 'CONVERT_SUCCESS', payload: [result] })
    } catch (err) {
      const error: AppError = {
        id: uid(),
        level: 'error',
        message: err instanceof Error ? err.message : '转换失败，请重试',
        fileName: files[0]?.file.name,
      }
      dispatch({ type: 'CONVERT_ERROR', payload: error })
    }
  }, [files, targetFormat, dispatch])

  const handleDownload = useCallback(() => {
    if (results.length > 0) {
      downloadSingleResult(results[0])
    }
  }, [results])

  return (
    <div className="w-full max-w-3xl mx-auto">
      <FileDropZone multiple={false} />
      <FormatSelector />

      {/* 转换按钮 */}
      {hasFile && !hasResult && (
        <div className="text-center mt-4">
          <button
            className={`
              px-6 py-2.5 rounded-lg text-sm font-medium text-white
              transition-all
              ${converting
                ? 'bg-blue-400 cursor-wait'
                : 'bg-blue-500 hover:bg-blue-600 active:scale-95 shadow-sm'
              }
            `}
            onClick={handleConvert}
            disabled={converting}
          >
            {converting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                转换中...
              </span>
            ) : (
              '🔄 开始转换'
            )}
          </button>
        </div>
      )}

      {/* 转换结果预览 */}
      {hasResult && (
        <div className="mt-4">
          <PreviewComparison result={results[0]} />
          <SizeComparison result={results[0]} />

          <div className="flex gap-3 justify-center mt-4">
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-green-500 hover:bg-green-600 active:scale-95 shadow-sm transition-all"
              onClick={handleDownload}
            >
              ⬇ 下载转换后图片
            </button>
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
              onClick={() => dispatch({ type: 'RESET' })}
            >
              重新选择
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
