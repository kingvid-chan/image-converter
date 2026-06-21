import { AppProvider, useAppContext } from './context/AppContext'
import Header from './components/Header'
import ModeTabs from './components/ModeTabs'
import SingleMode from './components/single/SingleMode'
import BatchMode from './components/batch/BatchMode'
import ErrorToast from './components/ErrorToast'

function AppContent() {
  const { state } = useAppContext()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <ModeTabs />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-8">
        {state.mode === 'single' ? <SingleMode /> : <BatchMode />}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100">
        图片格式转换器 v0.0.1 · 所有处理在浏览器本地完成，不上传服务器
      </footer>

      <ErrorToast />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
