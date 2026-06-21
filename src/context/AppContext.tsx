import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import type { AppState, AppAction, ImageFormat } from '../types'

const initialState: AppState = {
  mode: 'single',
  files: [],
  targetFormat: 'image/png',
  results: [],
  errors: [],
  converting: false,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
        files: [],
        results: [],
        errors: [],
      }

    case 'ADD_FILES':
      return {
        ...state,
        files: action.payload.files,
        results: [],
        errors: action.payload.errors,
      }

    case 'REMOVE_FILE':
      return {
        ...state,
        files: state.files.filter(f => f.id !== action.payload),
        results: state.results.filter(r => r.id !== action.payload),
      }

    case 'SET_TARGET_FORMAT': {
      const format: ImageFormat = action.payload
      // 检查源格式与目标格式相同的情况，生成提示
      const sameFormatErrors = state.files
        .filter(f => f.format === format)
        .map(f => ({
          id: `same-format-${f.id}`,
          level: 'info' as const,
          message: `文件 "${f.file.name}" 已是 ${format.split('/')[1].toUpperCase()} 格式，无需转换`,
          fileName: f.file.name,
        }))
      return {
        ...state,
        targetFormat: format,
        errors: sameFormatErrors.length > 0
          ? [...state.errors.filter(e => !e.id.startsWith('same-format-')), ...sameFormatErrors]
          : state.errors.filter(e => !e.id.startsWith('same-format-')),
      }
    }

    case 'CONVERT_START':
      return {
        ...state,
        converting: true,
        results: [],
        errors: state.errors.filter(e => e.level !== 'error'),
      }

    case 'CONVERT_SUCCESS':
      return {
        ...state,
        converting: false,
        results: action.payload,
      }

    case 'CONVERT_ERROR':
      return {
        ...state,
        converting: false,
        errors: [...state.errors, action.payload],
      }

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload],
      }

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      }

    case 'RESET':
      return { ...initialState, mode: state.mode }

    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: Dispatch<AppAction>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return ctx
}
