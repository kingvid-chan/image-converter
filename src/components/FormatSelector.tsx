import { useAppContext } from '../context/AppContext'
import type { ImageFormat } from '../types'
import { FORMAT_LABELS } from '../types'
import { isFormatSupported } from '../utils/converter'

const FORMAT_OPTIONS: ImageFormat[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
]

export default function FormatSelector() {
  const { state, dispatch } = useAppContext()
  const { targetFormat, files } = state

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_TARGET_FORMAT', payload: e.target.value as ImageFormat })
  }

  // 检查是否有文件与目标格式相同
  const hasSameFormat = files.length > 0 && files.some(f => f.format === targetFormat)

  return (
    <div className="w-full max-w-xs mx-auto mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        目标格式
      </label>
      <select
        value={targetFormat}
        onChange={handleChange}
        disabled={files.length === 0}
        className={`
          w-full px-4 py-2.5 rounded-lg border text-sm
          bg-white focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${hasSameFormat ? 'border-yellow-300 ring-1 ring-yellow-300' : 'border-gray-300'}
        `}
      >
        {FORMAT_OPTIONS.map(format => {
          const supported = isFormatSupported(format)
          return (
            <option
              key={format}
              value={format}
              disabled={!supported}
            >
              {FORMAT_LABELS[format]}
              {!supported ? ' (浏览器不支持)' : ''}
            </option>
          )
        })}
      </select>

      {hasSameFormat && (
        <p className="mt-1.5 text-xs text-yellow-600">
          ⚠️ 部分文件已是 {FORMAT_LABELS[targetFormat]} 格式
        </p>
      )}

      {!isFormatSupported('image/webp') && (
        <p className="mt-1.5 text-xs text-gray-400">
          当前浏览器不支持 WebP 格式输出
        </p>
      )}
    </div>
  )
}
