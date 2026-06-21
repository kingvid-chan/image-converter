import { useCallback, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import FileDropZone from '../FileDropZone'
import FormatSelector from '../FormatSelector'
import FileList from './FileList'
import ConversionProgress from './ConversionProgress'
import BatchResults from './BatchResults'
import { convertBatch } from '../../utils/converter'
import { downloadZip } from '../../utils/download'
import type { AppError } from '../../types'

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function BatchMode() {
  const { state, dispatch } = useAppContext()
  const { files, targetFormat, results, converting } = state
  const [progress, setProgress] = useState({ completed: 0, total: 0 })

  const hasFiles = files.length > 0
  const hasResults = results.length > 0

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return

    dispatch({ type: 'CONVERT_START' })
    setProgress({ completed: 0, total: files.length })

    try {
      const batchResults = await convertBatch(files, targetFormat, (completed, total) => {
        setProgress({ completed, total })
      })
      dispatch({ type: 'CONVERT_SUCCESS', payload: batchResults })
    } catch (err) {
      const error: AppError = {
        id: uid(),
        level: 'error',
        message: err instanceof Error ? err.message : '批量转换失败，请重试',
      }
      dispatch({ type: 'CONVERT_ERROR', payload: error })
    }
  }, [files, targetFormat, dispatch])

  const handleDownloadZip = useCallback(async () => {
    if (results.length === 0) return
    try {
      await downloadZip(results, targetFormat)
    } catch (err) {
      const error: AppError = {
        id: uid(),
        level: 'error',
        message: err instanceof Error ? err.message : 'ZIP 打包失败',
      }
      dispatch({ type: 'ADD_ERROR', payload: error })
    }
  }, [results, targetFormat, dispatch])

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 已选择文件时不显示 DropZone */}
      {!hasFiles && <FileDropZone multiple={true} />}

      {/* 文件列表（含添加更多入口） */}
      {hasFiles && !hasResults && !converting && (
        <>
          <FileDropZone multiple={true} />
          <FileList />
        </>
      )}

      {/* 转换中的文件列表 */}
      {converting && <FileList />}

      {/* 进度显示在格式选择器上方 */}
      <FormatSelector />

      {/* 转换按钮 */}
      {hasFiles && !hasResults && !converting && (
        <div className="text-center mt-4">
          <button
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-500
                       hover:bg-blue-600 active:scale-95 shadow-sm transition-all"
            onClick={handleConvert}
          >
            🔄 开始批量转换 ({files.length} 个文件)
          </button>
        </div>
      )}

      {/* 转换进度 */}
      {converting && (
        <ConversionProgress completed={progress.completed} total={progress.total} />
      )}

      {/* 转换结果 */}
      {hasResults && (
        <>
          <BatchResults results={results} />

          <div className="flex gap-3 justify-center mt-4">
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-green-500
                         hover:bg-green-600 active:scale-95 shadow-sm transition-all"
              onClick={handleDownloadZip}
            >
              ⬇ 打包下载 ZIP
            </button>
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100
                         hover:bg-gray-200 active:scale-95 transition-all"
              onClick={() => dispatch({ type: 'RESET' })}
            >
              重新选择
            </button>
          </div>
        </>
      )}
    </div>
  )
}
