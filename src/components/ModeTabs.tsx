import { useAppContext } from '../context/AppContext'

export default function ModeTabs() {
  const { state, dispatch } = useAppContext()
  const { mode } = state

  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'single'
              ? 'bg-blue-500 text-white shadow'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          onClick={() => dispatch({ type: 'SET_MODE', payload: 'single' })}
        >
          单文件转换
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'batch'
              ? 'bg-blue-500 text-white shadow'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          onClick={() => dispatch({ type: 'SET_MODE', payload: 'batch' })}
        >
          批量转换
        </button>
      </div>
    </div>
  )
}
