import { useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import type { ErrorLevel } from '../types'

const LEVEL_STYLES: Record<ErrorLevel, { bg: string; border: string; icon: string; text: string }> = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    icon: '❌',
    text: 'text-red-800',
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    icon: '⚠️',
    text: 'text-orange-800',
  },
  info: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    icon: 'ℹ️',
    text: 'text-yellow-800',
  },
}

/** 单个错误提示，自动消失 */
function ToastItem({
  error,
  onDismiss,
}: {
  error: { id: string; level: ErrorLevel; message: string }
  onDismiss: (id: string) => void
}) {
  const style = LEVEL_STYLES[error.level]

  useEffect(() => {
    // info 级别 3 秒自动消失，error 和 warning 5 秒
    const timeout = error.level === 'info' ? 3000 : 5000
    const timer = setTimeout(() => onDismiss(error.id), timeout)
    return () => clearTimeout(timer)
  }, [error.id, error.level, onDismiss])

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border shadow-sm
        animate-[slideDown_0.3s_ease-out]
        ${style.bg} ${style.border} ${style.text}
      `}
      role="alert"
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{style.icon}</span>
      <p className="text-sm flex-1">{error.message}</p>
      <button
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
        onClick={() => onDismiss(error.id)}
        aria-label="关闭"
      >
        ✕
      </button>
    </div>
  )
}

export default function ErrorToast() {
  const { state, dispatch } = useAppContext()

  const dismiss = (id: string) => {
    // 从 errors 中移除该项
    dispatch({
      type: 'ADD_FILES',
      payload: {
        files: state.files,
        errors: state.errors.filter(e => e.id !== id),
      },
    })
  }

  if (state.errors.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md flex flex-col gap-2 px-4">
      {state.errors.map(error => (
        <ToastItem key={error.id} error={error} onDismiss={dismiss} />
      ))}
    </div>
  )
}
