/** 支持的图片格式 */
export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp'

/** 文件校验状态 */
export type FileStatus = 'valid' | 'invalid_format' | 'corrupted' | 'oversized'

/** 用户上传的图片文件实体 */
export interface ImageFile {
  id: string
  file: File
  format: ImageFormat
  size: number          // 字节
  width?: number
  height?: number
  previewUrl: string    // URL.createObjectURL
  status: FileStatus
}

/** 单次转换结果 */
export interface ConversionResult {
  id: string
  originalFile: ImageFile
  convertedBlob: Blob
  originalSize: number     // 字节
  convertedSize: number    // 字节
  originalFormat: ImageFormat
  targetFormat: ImageFormat
  originalPreviewUrl: string
  convertedPreviewUrl: string  // URL.createObjectURL(convertedBlob)
}

/** 错误/警告类型 */
export type ErrorLevel = 'error' | 'warning' | 'info'

/** 应用错误/提示 */
export interface AppError {
  id: string
  level: ErrorLevel
  message: string
  fileName?: string
}

/** 全局应用状态 */
export interface AppState {
  mode: 'single' | 'batch'
  files: ImageFile[]
  targetFormat: ImageFormat
  results: ConversionResult[]
  errors: AppError[]
  converting: boolean
}

/** Action 类型枚举 */
export type AppAction =
  | { type: 'SET_MODE'; payload: 'single' | 'batch' }
  | { type: 'ADD_FILES'; payload: { files: ImageFile[]; errors: AppError[] } }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_TARGET_FORMAT'; payload: ImageFormat }
  | { type: 'CONVERT_START' }
  | { type: 'CONVERT_SUCCESS'; payload: ConversionResult[] }
  | { type: 'CONVERT_ERROR'; payload: AppError }
  | { type: 'ADD_ERROR'; payload: AppError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET' }

/** 格式显示名称映射 */
export const FORMAT_LABELS: Record<ImageFormat, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
  'image/bmp': 'BMP',
}

/** 格式文件扩展名映射 */
export const FORMAT_EXTENSIONS: Record<ImageFormat, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
}

/** 文件扩展名 → MIME 映射 */
export const EXTENSION_TO_FORMAT: Record<string, ImageFormat> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
}

/** 校验结果 */
export interface ValidationResult {
  valid: boolean
  status: FileStatus
  error?: string
}

/** 质量参数 */
export const QUALITY_PRESETS: Partial<Record<ImageFormat, number>> = {
  'image/jpeg': 0.92,
  'image/webp': 0.92,
}
