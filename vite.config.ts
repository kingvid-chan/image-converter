import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** 版本令牌 — 每次迭代递增 */
const VERSION = '0.0.1'

/**
 * 自定义插件：为所有静态资源 URL 追加版本令牌 ?v=0.0.N
 * 确保浏览器在版本迭代后不会命中旧缓存
 */
function versionTokenPlugin(): Plugin {
  return {
    name: 'version-token',
    enforce: 'post',
    transformIndexHtml(html) {
      // 为所有本地 JS/CSS 资源链接添加版本令牌
      // 匹配 src="/projects/image-converter/assets/..." 或 href="..."
      return html.replace(
        /(src|href)="(\/projects\/image-converter\/[^"]+)"/g,
        (_match, attr, url) => {
          // 跳过已有查询参数的 URL
          if (url.includes('?')) return `${attr}="${url}"`
          return `${attr}="${url}?v=${VERSION}"`
        },
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), versionTokenPlugin()],
  base: '/projects/image-converter/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
