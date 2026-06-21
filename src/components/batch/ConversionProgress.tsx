interface ConversionProgressProps {
  completed: number
  total: number
}

export default function ConversionProgress({ completed, total }: ConversionProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1.5">
        <span>
          {completed === total
            ? '✅ 全部转换完成'
            : `🔄 正在转换... ${completed}/${total}`
          }
        </span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${
            completed === total ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
