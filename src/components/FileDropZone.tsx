import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { useAppContext } from '../context/AppContext'
import { validateFiles } from '../utils/validator'
import { getImageDimensionsSafe } from '../utils/validator'
import type { ImageFile, AppError, ImageFormat } from '../types'
import { EXTENSION_TO_FORMAT } from '../types'

/** 从文件名和类型确定格式 */
function getFormat(file: File): ImageFormat {
  if (file.type && ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'].includes(file.type)) {
    return file.type as ImageFormat
  }
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  return EXTENSION_TO_FORMAT[ext] || 'image/png'
}

/** 生成唯一 ID */
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface FileDropZoneProps {
  multiple?: boolean
}

export default function FileDropZone({ multiple = false }: FileDropZoneProps) {
  const { state, dispatch } = useAppContext()
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasFiles = state.files.length > 0

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const files = Array.from(fileList)
      if (files.length === 0) return

      // 非 multiple 模式只取第一个文件
      const toProcess = multiple ? files : [files[0]]

      const { validFiles, errors } = await validateFiles(toProcess)

      // 构建 ImageFile 对象
      const imageFiles: ImageFile[] = []
      for (const file of validFiles) {
        const format = getFormat(file)
        const dimensions = await getImageDimensionsSafe(file)
        imageFiles.push({
          id: uid(),
          file,
          format,
          size: file.size,
          width: dimensions?.width,
          height: dimensions?.height,
          previewUrl: URL.createObjectURL(file),
          status: 'valid',
        })
      }

      // 将错误转为 AppError
      const appErrors: AppError[] = errors.map(e => ({
        id: uid(),
        level: e.level === 'error' ? 'error' : 'warning',
        message: e.message,
        fileName: e.fileName,
      }))

      dispatch({ type: 'ADD_FILES', payload: { files: imageFiles, errors: appErrors } })
    },
    [multiple, dispatch],
  )

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles],
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
      }
      // 重置 input 以允许重复选择同一文件
      e.target.value = ''
    },
    [processFiles],
  )

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-200
        ${isDragging
          ? 'border-blue-500 bg-blue-50 scale-[1.02]'
          : hasFiles
            ? 'border-green-300 bg-green-50/50'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/bmp"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {hasFiles ? (
        <div className="text-gray-600">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-medium">
            已选择 {state.files.length} 个文件
          </p>
          <p className="text-sm text-gray-400 mt-1">
            拖拽新文件或点击替换
            {multiple && ' · 可继续添加'}
          </p>
        </div>
      ) : (
        <div className="text-gray-500">
          <div className="text-4xl mb-3">📁</div>
          <p className="font-medium text-gray-600">
            拖拽图片到此处
          </p>
          <p className="text-sm mt-1">
            或点击选择文件
          </p>
          <p className="text-xs text-gray-400 mt-2">
            支持 PNG · JPEG · WebP · BMP
            {multiple && ' · 可多选'}
          </p>
        </div>
      )}
    </div>
  )
}
